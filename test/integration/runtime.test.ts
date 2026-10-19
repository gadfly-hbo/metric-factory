import {test,expect,vi} from "vitest";
import {mkdtemp,readFile,writeFile,rename} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {randomUUID} from "node:crypto";
import {createIntegratedClients, type IntegratedModel} from "../../src/llm/integrated-client.js";
const configuration:IntegratedModel={historyRequired:false,model:{provider:"offline",id:"fixture",protocol:"openai-completions",endpoint:"https://offline.invalid/v1",contextWindow:8192,maxOutputTokens:1024},apiKey:"synthetic-no-real-key",limits:{cumulative:"unlimited",maxOutputTokens:1024,modelTimeoutMs:1000,toolTimeoutMs:1000,controlTimeoutMs:1000}};
const dir=()=>mkdtemp(join(tmpdir(),"mf-codec-"));
const response=()=>new Response([
 {id:"fixture",object:"chat.completion.chunk",model:"fixture",choices:[{index:0,delta:{role:"assistant",content:"synthetic result"},finish_reason:null}]},
 {id:"fixture",object:"chat.completion.chunk",model:"fixture",choices:[{index:0,delta:{},finish_reason:"stop"}],usage:{prompt_tokens:4,completion_tokens:2,total_tokens:6}}
].map(x=>`data: ${JSON.stringify(x)}\n\n`).join("")+"data: [DONE]\n\n",{headers:{"content-type":"text/event-stream"}});
test("MF-03 actual fixed SDK codec: explicit key, every request authorized, stable cumulative task ledger",async()=>{
 const directory=await dir(),authorize=vi.fn(async()=>true),fetch=vi.fn(async()=>response());
 const engine=createIntegratedClients({directory,configuration,authorize,fetch});const id=randomUUID(),client=engine.client(id,new AbortController().signal);
 expect((await client.complete({system:"synthetic",user:"one"})).text).toBe("synthetic result");
 await client.complete({system:"synthetic",user:"two"});
 expect(fetch).toHaveBeenCalledTimes(2);expect(authorize.mock.calls.length).toBeGreaterThanOrEqual(4);
 const ledger=JSON.parse(await readFile(join(directory,"model-budget.json"),"utf8"));expect(Object.keys(ledger.tasks)).toEqual([id]);expect(ledger.tasks[id].usage.modelCalls).toBe(2);expect(ledger.tasks[id].usage.outputTokens).toBe(4);
 expect(await engine.settled(id)).toBe(true);expect(engine.state()).toEqual({active:false,unknown:false});
 const reopened=createIntegratedClients({directory,configuration,authorize,fetch});await reopened.client(id,new AbortController().signal).complete({system:"synthetic",user:"three"});
 expect(JSON.parse(await readFile(join(directory,"model-budget.json"),"utf8")).tasks[id].usage.modelCalls).toBe(3);
 expect(await readFile(join(directory,"audit.jsonl"),"utf8")).not.toContain(configuration.apiKey);
});
test("MF-03 missing authority and failed durable audit prevent physical requests",async()=>{
 for(const deny of [true,false]){
 const fetch=vi.fn(async()=>response());const engine=createIntegratedClients({directory:await dir(),configuration,fetch,authorize:async()=>!deny,...(!deny?{audit:{append:async()=>{throw Error("DISK_FAILED");}}}:{})});
 await expect(engine.client(randomUUID(),new AbortController().signal).complete({system:"synthetic",user:"secret synthetic"})).rejects.toThrow();expect(fetch).not.toHaveBeenCalled();
 }
});
test("MF-07 interruption metadata survives restart and cannot be evaded by a new task",async()=>{
 const directory=await dir(),id=randomUUID();await writeFile(join(directory,"audit.jsonl"),"");await writeFile(join(directory,"model-budget.json"),JSON.stringify({version:1,tasks:{}}));await writeFile(join(directory,"tasks.json"),JSON.stringify({version:1,tasks:{[id]:{active:true,known:false}}}));const fetch=vi.fn(async()=>response());
 const engine=createIntegratedClients({directory,configuration,fetch,authorize:async()=>true});expect(engine.state().unknown).toBe(true);expect(()=>engine.client(randomUUID(),new AbortController().signal)).toThrow("TASK_UNSETTLED");expect(fetch).not.toHaveBeenCalled();
});
test("MF-03 cumulative cap blocks a second physical request without resetting stable accounting",async()=>{
 const fetch=vi.fn(async()=>response()),engine=createIntegratedClients({directory:await dir(),configuration:{...configuration,caps:{maxCalls:1}},fetch,authorize:async()=>true});const client=engine.client(randomUUID(),new AbortController().signal);
 await client.complete({system:"synthetic",user:"one"});await expect(client.complete({system:"synthetic",user:"two"})).rejects.toThrow("BUDGET_EXHAUSTED");expect(fetch).toHaveBeenCalledTimes(1);
});
test("MF-07 actual SDK propagates cancellation and retains unknown physical consumption",async()=>{
 const directory=await dir(),controller=new AbortController();let started!:()=>void;
 const dispatched=new Promise<void>(resolve=>{started=resolve;});
 const fetch=vi.fn(async(_input:unknown,init?:RequestInit)=>new Promise<Response>((_resolve,reject)=>{
  const signal=init?.signal;expect(signal).toBeDefined();
  signal!.addEventListener("abort",()=>reject(new DOMException("stopped","AbortError")),{once:true});started();
 }));
 const engine=createIntegratedClients({directory,configuration,fetch:fetch as typeof globalThis.fetch,authorize:async()=>true});
 const id=randomUUID(),running=engine.client(id,controller.signal).complete({system:"synthetic",user:"cancel synthetic"});
 const failure=expect(running).rejects.toThrow();await dispatched;controller.abort();await failure;
 expect(fetch).toHaveBeenCalledTimes(1);expect(await engine.settled(id)).toBe(false);
 expect(engine.state().unknown).toBe(true);
 const reopened=createIntegratedClients({directory,configuration,fetch:fetch as typeof globalThis.fetch,authorize:async()=>true});
 expect(()=>reopened.client(randomUUID(),new AbortController().signal)).toThrow("TASK_UNSETTLED");
});
test("MF-03 malformed persisted budget never becomes a fresh empty budget",async()=>{
 const directory=await dir();await writeFile(join(directory,"audit.jsonl"),"");await writeFile(join(directory,"tasks.json"),JSON.stringify({version:1,tasks:{}}));await writeFile(join(directory,"model-budget.json"),'{"version":999}');
 const fetch=vi.fn(async()=>response());const engine=createIntegratedClients({directory,configuration,fetch,authorize:async()=>true});
 await expect(engine.client(randomUUID(),new AbortController().signal).complete({system:"synthetic",user:"one"})).rejects.toThrow();
 expect(fetch).not.toHaveBeenCalled();
});

// F-MF-06: loss of one ledger must never create a new allowance/history.
test("MF-03/09 missing integrated history refuses before another physical request",async()=>{
 for(const unknown of [false,true])for(const names of [["audit.jsonl"],["model-budget.json"],["tasks.json"],["tasks.json","model-budget.json"],["tasks.json","model-budget.json","audit.jsonl"]]){
  const directory=await dir(),fetch=vi.fn(async()=>response()),authorize=vi.fn(async()=>true);
  const initial=createIntegratedClients({directory,configuration,fetch,authorize});
  await initial.client(randomUUID(),new AbortController().signal).complete({system:"synthetic",user:"prior"});
  if(unknown){const state=JSON.parse(await readFile(join(directory,"tasks.json"),"utf8"));for(const task of Object.values(state.tasks) as Array<{known:boolean}>)task.known=false;await writeFile(join(directory,"tasks.json"),JSON.stringify(state));}
  const saved=await Promise.all(names.map(async name=>({name,bytes:await readFile(join(directory,name))})));
  for(const {name} of saved)await rename(join(directory,name),join(directory,name+".preserved"));
  const attempts=fetch.mock.calls.length;
  await expect(async()=>{const reopened=createIntegratedClients({directory,configuration:{...configuration,historyRequired:true},fetch,authorize});await reopened.client(randomUUID(),new AbortController().signal).complete({system:"synthetic",user:"must refuse"});}).rejects.toThrow();
  expect(fetch).toHaveBeenCalledTimes(attempts);
  for(const {name,bytes} of saved){expect(await readFile(join(directory,name+".preserved"))).toEqual(bytes);await expect(readFile(join(directory,name))).rejects.toThrow();}
 }
});
test("MF-03/09 primitive task history is corrupt, not an empty task set",async()=>{
 for(const tasks of [0,1,"",true]){
  const directory=await dir(),fetch=vi.fn(async()=>response());
  await writeFile(join(directory,"audit.jsonl"),"");
  await writeFile(join(directory,"model-budget.json"),JSON.stringify({version:1,tasks:{}}));
  await writeFile(join(directory,"tasks.json"),JSON.stringify({version:1,tasks}));
  const before=await readFile(join(directory,"tasks.json"));
  expect(()=>createIntegratedClients({directory,configuration,fetch,authorize:async()=>true})).toThrow();
  expect(fetch).not.toHaveBeenCalled();expect(await readFile(join(directory,"tasks.json"))).toEqual(before);
 }
});

test("MF-03/09 audit loss after client creation refuses without recreating audit or calling provider",async()=>{
 const directory=await dir(),fetch=vi.fn(async()=>response());
 const engine=createIntegratedClients({directory,configuration,fetch,authorize:async()=>true});
 await engine.client(randomUUID(),new AbortController().signal).complete({system:"synthetic",user:"prior"});
 const audit=await readFile(join(directory,"audit.jsonl"));
 await rename(join(directory,"audit.jsonl"),join(directory,"audit.jsonl.preserved"));
 await expect(engine.client(randomUUID(),new AbortController().signal).complete({system:"synthetic",user:"refuse"})).rejects.toThrow();
 expect(fetch).toHaveBeenCalledTimes(1);
 await expect(readFile(join(directory,"audit.jsonl"))).rejects.toThrow();
 expect(await readFile(join(directory,"audit.jsonl.preserved"))).toEqual(audit);
});
