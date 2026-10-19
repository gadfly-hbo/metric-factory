import {test, expect, vi} from "vitest";
import {parse as parseYaml} from "yaml";
import {releaseInstance, readReleaseIndex} from "../../src/sap/release.js";
import {registerReceipt} from "../../src/sap/receipt.js";
import {mkdtemp, mkdir, readdir, readFile, realpath, rename, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {createHash} from "node:crypto";
import {createUiServer} from "../../src/ui/server.js";
import {IntegratedJob, type UiIntegration} from "../../src/ui/integration.js";
vi.mock("../../src/llm/env-auto.js", () => ({resolveLlmEnvAuto: vi.fn(() => {throw Error("CREDENTIAL_DISCOVERY_FORBIDDEN");})}));
const BLUEPRINT = JSON.stringify({
  blueprint: {
    title: "门店扩张选择分析体系",
    intent: "设计具体分析方案",
    purpose: "评估是否继续扩店，比较候选道路的收益与代价。",
    decision: "下一阶段是否继续扩店？",
    boundary: "不承诺资源投入；选址执行归运营。",
    deliverable: "候选道路比较与试点建议。",
    contexts: ["战略选择"],
    organizations: ["假设先行"],
    questions: [{ id: "q1", title: "现有店型是否值得复制？", detail: "看单店回收。", metric_refs: [] }],
    hypotheses: [
      { id: "h1", statement: "现有店型可回收。", support: "单店模型。", counter: "样本期太短。", change_condition: "回收期超阈值则放弃。" }
    ],
    evidence_plan: [
      { id: "e1", name: "单店回收模型", kind: "测算模型", source: "财务与运营记录", check: "复核假设参数", insufficiency: "缺失时只输出定性比较" }
    ],
    options: [
      { id: "expand", name: "选择性继续扩店", tradeoff: "占用资本；需证明店型可复制。" },
      { id: "hold", name: "暂停扩店优化存量", tradeoff: "放弃增长窗口。" }
    ]
  },
  added_metrics: [],
  added_scenarios: []
});

async function fixture(overrides: Partial<UiIntegration> = {}) {
 const root=await realpath(await mkdtemp(join(tmpdir(),"mf-integrated-")));
 const workspace=join(root,"workspace"), userMethodsDir=join(root,"methods"),userTemplatesDir=join(root,"templates");
 await Promise.all([workspace,userMethodsDir,userTemplatesDir].map(p=>mkdir(p)));
 const hooks:UiIntegration={userMethodsDir,userTemplatesDir, modelLabel:"synthetic/offline",reviewer:"synthetic-reviewer", configured:()=>true,
 client:async()=>({complete:async()=>({text:BLUEPRINT})}), authorizePublication:async()=>{}, settled:async()=>true,
 guard:async()=>true,publicationSaved:async()=>true,published:async()=>{},recoverPublished:async()=>{},exportPublished:async()=>{throw Error("NO_SAVED_VERSION");},...overrides};
 const server=createUiServer({workspaceDir:workspace,templatesDir:resolve("templates"),envFilePath:join(root,"forbidden.env"),authJsonPath:join(root,"forbidden-auth.json"),integration:hooks});
 await new Promise<void>(r=>server.listen(0,"127.0.0.1",r));
 const origin=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
 const api=(path:string,body?:unknown,method="POST")=>fetch(origin+path,body===undefined?{}:{method,headers:{"content-type":"application/json"},body:JSON.stringify(body)});
 const wait=async(id:string)=>{for(let i=0;i<100;i++){const j=await(await api(`/api/jobs/${id}`)).json();if(j.cancellation!=="requested")return j;await new Promise(r=>setTimeout(r,10));}throw Error("job unsettled");};
 return {root,workspace,hooks,api,wait,close:()=>new Promise<void>(r=>server.close(()=>r()))};
}
test("MF-03: injected configuration bypasses discovery; missing configuration never calls a model",async()=>{
 const client=vi.fn(); const f=await fixture({configured:()=>false,client});try{
 expect(await(await f.api("/api/llm-status")).json()).toEqual({mode:"none",integrated:true});
 expect((await f.api("/settings")).status).toBe(404);
 const {jobId}=await(await f.api("/api/instances/create-job",{need:"合成需求"})).json();
 const job=await f.wait(jobId);expect(job.status).toBe("error");expect(job.error).toContain("JuanerAI");expect(client).not.toHaveBeenCalled();expect(await readdir(f.workspace)).toEqual([]);
 }finally{await f.close();}
});
test("MF-07: stop reaches injected signal; late valid result cannot create a workspace draft",async()=>{
 let deliver!:(value:{text:string})=>void;let signal:AbortSignal|undefined;
 const publish=vi.fn(); const f=await fixture({authorizePublication:publish,client:async(_id,s)=>{signal=s;return {complete:()=>new Promise(r=>{deliver=r;})};}});
 try{
 const {jobId}=await(await f.api("/api/instances/create-job",{need:"合成需求"})).json();
 expect(signal?.aborted).toBe(false);
 expect((await f.api("/api/instances/create-job",{need:"不得并发"})).status).toBe(409);
 expect((await(await f.api(`/api/jobs/${jobId}/cancel`,{})).json()).cancellation).toBe("requested");
 expect(signal?.aborted).toBe(true); deliver({text:BLUEPRINT});
 expect((await f.wait(jobId)).cancellation).toBe("stopped");expect(publish).not.toHaveBeenCalled();expect(await readdir(f.workspace)).toEqual([]);
 }finally{await f.close();}
});
test("MF-07: unknown settlement blocks admission instead of creating a fresh task to reset it",async()=>{
 const f=await fixture({settled:async()=>false});try{
 const {jobId}=await(await f.api("/api/instances/create-job",{need:"合成需求"})).json();expect((await f.wait(jobId)).cancellation).toBe("unknown");
 expect((await f.api("/api/instances/create-job",{need:"不得重新准入"})).status).toBe(409);
 }finally{await f.close();}
});
test("MF-05: host save failure is not a successful delivery; retry reconciles the existing version",async()=>{
 let saved=false;const recover=vi.fn(async()=>{saved=true;});const f=await fixture({publicationSaved:async()=>saved,published:async()=>{throw Error("HOST_COPY_FAILED");},recoverPublished:recover});try{
 const {jobId}=await(await f.api("/api/instances/create-job",{need:"合成战略问题"})).json();const id=(await f.wait(jobId)).instanceId;
 const path=`/api/instances/${encodeURIComponent(id)}`;
 expect((await f.api(path+"/confirm-review",{})).status).toBe(200);
 expect((await f.api(path+"/deliver",{})).status).toBe(500);
 expect((await(await f.api(path)).json()).delivered).toBeNull();
 expect((await f.api(path+"/deliver",{})).status).toBe(201);expect(recover).toHaveBeenCalledTimes(1);
 expect((await(await f.api(path)).json()).delivered.version).toBe("1.0.0");
 expect((await f.api(path+"/deliver",{})).status).toBe(422);expect(recover).toHaveBeenCalledTimes(1);
 const index=await readFile(join(f.workspace,"releases/index.yaml"),"utf8");expect(index.match(/version: 1.0.0/g)).toHaveLength(1);
 }finally{await f.close();}
});
test("MF-04: personal templates write to the injected data root; traversal is rejected",async()=>{
 const f=await fixture();try{
 const saved=await(await f.api("/api/templates/user",{name:"合成个人模板",rows:[{name:"收入",description:"合成定义"}]})).json();
 expect(await readdir(f.hooks.userTemplatesDir)).toEqual([saved.id+".yaml"]);
 expect((await(await f.api("/api/templates")).json()).templates.some((x:{id:string})=>x.id===saved.id)).toBe(true);
 expect((await f.api("/api/templates/user/preview",{id:"../../outside"})).status).toBe(400);
 }finally{await f.close();}
});
test("MF-06: original production HTML and CSS remain byte-identical",async()=>{
 for(const [file,sha] of Object.entries({"index.html":"28dd2a704e5fd2b4c222e5f0515d7527379a2fe33a40db01eb15a8f41b679c52","style.css":"a071e9c6d099a6fb50db54a5b69ee37b5d252eaf87eda9e4786857ffa4a13133"})) expect(createHash("sha256").update(await readFile("src/ui/public/"+file)).digest("hex")).toBe(sha);
});
test("MF-07: cancellation during publication authorization wins; claimed publication reports completion",async()=>{
 let unblock!:()=>void;
 const hooks={authorizePublication:()=>new Promise<void>(r=>unblock=r),settled:async()=>true};
 const job=new IntegratedJob("first",hooks);const pending=job.claimPublication();job.cancel();unblock();await expect(pending).rejects.toThrow();await job.finish();expect(job.state()).toBe("stopped");
 const done=new IntegratedJob("second",{...hooks,authorizePublication:async()=>{}});await done.claimPublication();done.cancel();await done.finish();expect(done.state()).toBe("completed");
});

test("MF-05: missing or empty index and orphan snapshots never permit immutable version overwrite",async()=>{
 for(const fault of ["missing", "empty", "orphan"]){
  const f=await fixture();try{
   const created=await(await f.api("/api/templates/use",{templateId:"cloud-cost"})).json(),path="/api/instances/"+encodeURIComponent(created.instanceId);
   const first=await(await f.api(path+"/deliver",{})).json(),dir=join(f.workspace,"releases"),index=join(dir,"index.yaml"),snapshot=join(dir,first.packageId,"1.0.0.sap.yaml"),original=await readFile(snapshot),originalIndex=await readFile(index);
   expect((await f.api(path+"/metrics/"+created.system.metrics[0].id,{description:"合成定义修改，保持已发布字节"},"PATCH")).status).toBe(200);
   let protectedPath=snapshot,protectedBytes=original;
   if(fault==="orphan"){protectedPath=join(dir,first.packageId,"1.0.1.sap.yaml");protectedBytes=Buffer.from("synthetic interrupted snapshot");await writeFile(protectedPath,protectedBytes);}
   else{await rename(index,join(f.root,"original-index.yaml"));if(fault==="empty")await writeFile(index,"releases: []\n");}
   expect((await f.api(path+"/deliver",{})).status).toBeGreaterThanOrEqual(400);
   expect(await readFile(protectedPath)).toEqual(protectedBytes);expect(await readFile(snapshot)).toEqual(original);
   if(fault==="missing")await expect(readFile(index)).rejects.toMatchObject({code:"ENOENT"});
   else expect(await readFile(index)).toEqual(fault==="empty"?Buffer.from("releases: []\n"):originalIndex);
  }finally{await f.close();}
 }
});

for(const fault of ['empty','partial'])test('MF-05: cross-system '+fault+' history refuses publication without modifying material',async()=>{
 const f=await fixture();try{
  const make=async(templateId:string)=>{const r=await f.api('/api/templates/use',{templateId});expect(r.status).toBe(201);return '/api/instances/'+encodeURIComponent((await r.json()).instanceId);};
  const a=await make('cloud-cost'),firstResponse=await f.api(a+'/deliver',{});expect(firstResponse.status).toBe(201);const first=await firstResponse.json();
  if(fault==='partial'){const c=await make('saas-subscription');expect((await f.api(c+'/deliver',{})).status).toBe(201);}
  const b=await make('apparel-brand-retail'),dir=join(f.workspace,'releases'),index=join(dir,'index.yaml'),original=await readFile(index),history=parseYaml(original.toString());
  const snapshot=join(dir,first.packageId,'1.0.0.sap.yaml'),bytes=await readFile(snapshot),damaged=Buffer.from(JSON.stringify({releases:history.releases.slice(1)}));
  await rename(index,join(f.root,'complete-index-preserved.yaml'));await writeFile(index,damaged);
  expect((await f.api(b+'/deliver',{})).status).toBeGreaterThanOrEqual(400);
  expect(await readFile(index)).toEqual(damaged);expect(await readFile(snapshot)).toEqual(bytes);
  await rename(index,join(f.root,'damaged-index-preserved.yaml'));await rename(join(f.root,'complete-index-preserved.yaml'),index);
  expect((await f.api(b+'/deliver',{})).status).toBe(201);expect(await readFile(snapshot)).toEqual(bytes);
 }finally{await f.close();}
});

for(const packageId of [undefined,'receipts'])test('MF-05: existing receipts permit the next release; SAP history remains protected '+(packageId??'standalone default'),async()=>{
 const f=await fixture();try{
  const created=await(await f.api('/api/templates/use',{templateId:'cloud-cost'})).json(),path='/api/instances/'+encodeURIComponent(created.instanceId);
  const releasesDir=join(f.root,'standalone-releases'),opts={instancePath:join(f.workspace,created.instanceId),templatesDir:resolve('templates'),releasesDir,releasedBy:'synthetic-reviewer',now:'2026-10-19T00:00:00Z',packageId};
  const first=await releaseInstance({...opts,version:'1.0.0'});expect(first.packageId).toBe(packageId??'instance');const original=await readFile(first.snapshotPath);
  const registered=registerReceipt({releasesDir,now:opts.now,receiptText:JSON.stringify({task_id:'synthetic-existing-receipt',package:{id:first.packageId,version:first.version,content_fingerprint:first.contentFingerprint,package_fingerprint:first.packageFingerprint},computed_at:opts.now})});
  expect(registered.status).toBe('对账一致');const receipt=await readFile(registered.storedPath);
  expect((await f.api(path+'/metrics/'+created.system.metrics[0].id,{description:'已有采用回执后的正常定义修改'},'PATCH')).status).toBe(200);
  const next=await releaseInstance({...opts,version:'1.0.1'});expect(next.version).toBe('1.0.1');expect(await readFile(first.snapshotPath)).toEqual(original);expect(await readFile(registered.storedPath)).toEqual(receipt);
  const indexBefore=await readFile(first.indexPath),orphan=join(releasesDir,'receipts/9.0.0.sap.yaml');await writeFile(orphan,'synthetic orphan SAP');
  expect(()=>readReleaseIndex(first.indexPath)).toThrow('发布登记与已有快照不一致');expect(await readFile(first.indexPath)).toEqual(indexBefore);expect(await readFile(orphan,'utf8')).toBe('synthetic orphan SAP');expect(await readFile(registered.storedPath)).toEqual(receipt);
 }finally{await f.close();}
});
