import {randomBytes,randomUUID,timingSafeEqual} from "node:crypto";
import {mkdirSync,readFileSync} from "node:fs";
import {join,isAbsolute} from "node:path";
import {createUiServer} from "../ui/server.js";
import {createIntegratedClients,type IntegratedModel} from "../llm/integrated-client.js";
import {readPublished} from "./publication.js";
import {assertIntegratedDataTree} from "../ui/integration-paths.js";

if(!process.send||!process.connected)throw Error("HOST_OWNER_REQUIRED");
const awaiting=new Map<string,{resolve:(v:any)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
const ask=(operation:string,value:unknown):Promise<any>=>new Promise((resolve,reject)=>{
 const id=randomUUID(),timer=setTimeout(()=>{awaiting.delete(id);reject(Error("HOST_REPLY_UNKNOWN"));},10000);
 awaiting.set(id,{resolve,reject,timer});process.send!({kind:"owner",id,operation,value});
});
let initialized=false;
process.on("message",(m:any)=>{
 if(m?.kind==="owner-reply") {const p=awaiting.get(m.id);if(!p)return;clearTimeout(p.timer);awaiting.delete(m.id);m.ok?p.resolve(m.value):p.reject(Error("HOST_REQUEST_DENIED"));return;}
 if(m?.kind!=="initialize"||initialized)return;initialized=true;
 void start(m).catch(()=>{process.send?.({kind:"failed",nonce:m.nonce});process.exitCode=1;process.disconnect?.();});
});
async function start(m:any){
 if(typeof m.reviewer!=="string"||!m.reviewer.trim()||typeof m.owner!=="string"||!/^[a-f0-9]{64}$/.test(m.owner)||!isAbsolute(m.dataRoot)||!isAbsolute(m.programRoot)||!/^[-a-zA-Z0-9]+$/.test(m.nonce))throw Error("HOST_INIT_INVALID");
 const root=m.dataRoot as string;
 for(const name of ["workspace","methods","templates","runtime"])mkdirSync(join(root,name),{recursive:true,mode:0o700});
 await assertIntegratedDataTree(root);
 const session=randomBytes(32).toString("hex"),tickets=new Map<string,number>();
 let origin="",closing=false,requests=0,mutations=0,previous:Promise<void>=Promise.resolve();
 const completions=new WeakMap<object,()=>void>();
 const jobs=new Set<string>();
 const clients=new Map<string,ReturnType<typeof createIntegratedClients>>();
 const state=()=>{
  // Persistent interrupted tasks remain unsettled even before any new client exists.
  let active=false,unknown=false;
  try {const saved=JSON.parse(readFileSync(join(root,"runtime/tasks.json"),"utf8"));if(saved.version!==1||!saved.tasks||typeof saved.tasks!=="object"||Array.isArray(saved.tasks))throw Error("bad");for(const t of Object.values(saved.tasks) as any[]){if(typeof t?.active!=="boolean"||typeof t?.known!=="boolean")throw Error("bad");active ||=t.active;unknown ||=!t.known;}}
  catch(e){if((e as NodeJS.ErrnoException).code!=="ENOENT")unknown=true;}
  for(const engine of clients.values()){const s=engine.state();active ||=s.active;unknown ||=s.unknown;}
  return {active:active||jobs.size>0,unknown,requests,mutations};
 };
 const equal=(a:unknown,b:string)=>typeof a==="string"&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
 const publish=async(packageId:string,version:string)=>ask("save",readPublished(join(root,"workspace/releases"),packageId,version));
 const server=createUiServer({workspaceDir:join(root,"workspace"),templatesDir:join(m.programRoot,"templates"),integration:{
  userMethodsDir:join(root,"methods"),userTemplatesDir:join(root,"templates"),modelLabel:"host-configured",reviewer:m.reviewer,configured:()=>m.modelConfigured===true,
  jobStarted(id){const s=state();if(s.active||s.unknown)throw Error("TASK_UNSETTLED");jobs.add(id);},
  async client(id,signal){
   const s=state();if(jobs.size>1||s.unknown)throw Error("TASK_UNSETTLED");
   const config=await ask("model-config",{taskId:id}) as IntegratedModel;
   signal.throwIfAborted();
   const engine=createIntegratedClients({directory:join(root,"runtime"),configuration:config,authorize:async(action,requestSignal)=>{
    if(signal.aborted||requestSignal.aborted)return false;
    const allowed=await ask("authorize",{taskId:id,kind:action.kind,...(action.kind==="model"?{provider:action.request.model.provider,model:action.request.model.id,endpoint:action.request.model.endpoint}:{})});
    return allowed===true&&!signal.aborted&&!requestSignal.aborted;
   }});clients.set(id,engine);return engine.client(id,signal);
  },
  async authorizePublication(id){if(!await clients.get(id)?.settled(id))throw Error("TASK_UNSETTLED");if(await ask("authorize",{taskId:id,kind:"publish"})!==true)throw Error("AUTHORITY_REQUIRED");},
  async settled(id){const known=await clients.get(id)?.settled(id)??true;await ask("settled",{taskId:id,known});jobs.delete(id);return known;},
  async published(result){await publish(result.packageId,result.version);},
  async recoverPublished(id,version){await publish(id,version);},
  async publicationSaved(packageId,version){const publication=readPublished(join(root,"workspace/releases"),packageId,version);return await ask("saved",{packageId,version,sha256:publication.sha256})===true;},
  async exportPublished(packageId,version){const publication=readPublished(join(root,"workspace/releases"),packageId,version);const saved=await ask("export",{packageId,version,sha256:publication.sha256});return {bytes:Buffer.from(saved.bytes,"base64"),filename:saved.filename};},
  requestFinished(req){completions.get(req)?.();completions.delete(req);},
  async guard(req,res){
   const deny=(status:number)=>{res.writeHead(status,{"content-type":"application/json"}).end(JSON.stringify({errors:["插件访问未获授权或实例正忙。"]}));return false;};
   if(closing||!origin||req.headers.host!==new URL(origin).host||!["127.0.0.1","::ffff:127.0.0.1"].includes(req.socket.remoteAddress??""))return deny(403);
   res.setHeader("referrer-policy","no-referrer");res.setHeader("x-content-type-options","nosniff");res.setHeader("cache-control","no-store");res.setHeader("content-security-policy","default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
   const url=new URL(req.url??"/",origin),ticket=url.searchParams.get("host-launch");
   if(req.method==="GET"&&url.pathname==="/"&&ticket){const expiry=tickets.get(ticket);tickets.delete(ticket);if(!expiry||expiry<Date.now())return deny(403);res.writeHead(303,{location:"/","set-cookie":`mf_${new URL(origin).port}=${session}; HttpOnly; SameSite=Strict; Path=/`}).end();return false;}
   const cookie=req.headers.cookie?.split(";").map(x=>x.trim()).find(x=>x.startsWith(`mf_${new URL(origin).port}=`))?.split("=")[1];
   if(!equal(cookie,session)&&!equal(req.headers["x-metric-owner"],m.owner))return deny(403);
   if(req.headers.origin!==undefined&&req.headers.origin!==origin||req.headers["sec-fetch-site"]==="cross-site")return deny(403);
   const write=!["GET","HEAD"].includes(req.method??"");
   if(write&&req.headers.origin!==origin&&!equal(req.headers["x-metric-owner"],m.owner))return deny(403);
   requests++;let release:()=>void=()=>{};
   const end=()=>{requests--;if(write){mutations--;release();}};completions.set(req,end);
   if(write){mutations++;const prior=previous;previous=new Promise<void>(r=>release=r);await prior;if(res.destroyed){release();return false;}if(closing||await ask("access",{}).catch(()=>false)!==true)return deny(403);}
   return true;
  }
 }});
 await new Promise<void>((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
 origin=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
 process.on("message",(request:any)=>{if(!request?.id||request.kind!=="command")return;void (async()=>{
  if(request.operation==="launch"){if(closing)throw Error("SERVICE_CLOSING");const ticket=randomBytes(32).toString("hex");tickets.set(ticket,Date.now()+30000);return {url:origin+"/?host-launch="+ticket};}
  if(request.operation==="state")return state();
  if(request.operation==="close"){const s=state();if(s.active||s.unknown||s.requests||s.mutations)throw Error("WORK_UNSETTLED");closing=true;await new Promise<void>(r=>server.close(()=>r()));return {closed:true};}
  throw Error("COMMAND_INVALID");
 })().then(value=>{process.send?.({kind:"reply",id:request.id,ok:true,value},()=>{if(request.operation==="close")process.disconnect?.();});},()=>process.send?.({kind:"reply",id:request.id,ok:false}));});
 process.on("disconnect",()=>{closing=true;server.close();});
 process.send!({kind:"ready",nonce:m.nonce,origin});
}
