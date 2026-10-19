import {mkdirSync, readFileSync, writeFileSync, renameSync, openSync, closeSync, fsyncSync, appendFileSync,existsSync,constants} from "node:fs";
import {join} from "node:path";
import {createRuntime, createPiTransport, type ModelConfig, type UncappedLimits, type Authorization, type AuditSink, type Runtime} from "pi-agent-runtime";
import {createFileBudgetStore, type BudgetCaps} from "./budget-store.js";
import type {LlmClient} from "./types.js";

/** Integration-only SDK adapter. No catalog, env, credential discovery or fallback. */
export interface IntegratedModel {
  /** Host retains earlier task admission; missing supplier history must not be initialized. */
  historyRequired: boolean;
  model: ModelConfig;
  apiKey: string;
  limits: UncappedLimits;
  caps?: BudgetCaps;
}
type TaskState = {active:boolean;known:boolean};
export function createIntegratedClients(options:{
  directory:string; configuration:IntegratedModel;
  authorize(action:Authorization,signal:AbortSignal):Promise<boolean>;
  /** Offline codec seam only; production supplies no alternate fetch. */
  fetch?:typeof globalThis.fetch;
  audit?:AuditSink;
}) {
  const config=structuredClone(options.configuration);
  if(typeof config.historyRequired!=="boolean" || config.limits.cumulative!=="unlimited" || !config.apiKey)throw Error("EXPLICIT_MODEL_POLICY_REQUIRED");
  mkdirSync(options.directory,{recursive:true,mode:0o700});
  const file=join(options.directory,"tasks.json"),budgetFile=join(options.directory,"model-budget.json");
  const auditFile=join(options.directory,"audit.jsonl");
  const hasTasks=existsSync(file),hasBudget=existsSync(budgetFile),hasAudit=existsSync(auditFile);
  if(!hasTasks||!hasBudget||!hasAudit){
    if(config.historyRequired||hasTasks||hasBudget||hasAudit)throw Error("TASK_LEDGER_INVALID");
    // First use only. An interrupted partial initialization is retained and refused next time.
    for(const path of [budgetFile,file,auditFile]){
      const fd=openSync(path,"wx",0o600);
      try{writeFileSync(fd,path===auditFile?"":JSON.stringify({version:1,tasks:{}}));fsyncSync(fd);}finally{closeSync(fd);}
    }
    const dir=openSync(options.directory,"r");try{fsyncSync(dir);}finally{closeSync(dir);}
  }
  let tasks:Record<string,TaskState>={};
  try {
    const saved=JSON.parse(readFileSync(file,"utf8"));
    if(saved.version!==1||!saved.tasks||typeof saved.tasks!=="object"||Array.isArray(saved.tasks))throw Error("TASK_LEDGER_INVALID");
    for(const [id,value] of Object.entries(saved.tasks)) {
      const x=value as TaskState;
      if(!/^[a-f0-9-]{36}$/.test(id)||typeof x?.active!=="boolean"||typeof x?.known!=="boolean")throw Error("TASK_LEDGER_INVALID");
      tasks[id]={active:x.active,known:x.known};
    }
  } catch(error){throw error;}
  let poisoned=false;
  const persist=()=>{try{
    const fd=openSync(file+".tmp","w",0o600);
    try{writeFileSync(fd,JSON.stringify({version:1,tasks}));fsyncSync(fd);}finally{closeSync(fd);}
    renameSync(file+".tmp",file);
    const dir=openSync(options.directory,"r");try{fsyncSync(dir);}finally{closeSync(dir);}
  }catch(error){poisoned=true;throw error;}};
  const runtimes=new Map<string,Runtime>();
  const admissions=new Map<string,number>();
  const authorize=async(action:Authorization,signal:AbortSignal)=>{
    const allowed=await options.authorize(action,signal);
    if(allowed && action.kind==="model")admissions.set(action.taskId,(admissions.get(action.taskId)??0)+1);
    return allowed;
  };
  const budgets=createFileBudgetStore(options.directory,config.caps,true);
  const audit:AuditSink=options.audit??{async append(e){
    // Metadata only. No request, response, endpoint headers, key or user content.
    const row={version:e.version,taskId:e.taskId,runId:e.runId,sequence:e.sequence,kind:e.kind,at:e.at,provider:e.provider,model:e.model,...(e.reason?{reason:e.reason}:{})};
    const fd=openSync(auditFile,constants.O_WRONLY|constants.O_APPEND);
    try{appendFileSync(fd,JSON.stringify(row)+"\n");fsyncSync(fd);}finally{closeSync(fd);}
  }};
  return {
    state(){return {active:Object.values(tasks).some(t=>t.active),unknown:poisoned||Object.values(tasks).some(t=>!t.known)};},
    client(taskId:string,signal:AbortSignal):LlmClient {
      if(!/^[a-f0-9-]{36}$/.test(taskId))throw Error("TASK_ID_INVALID");
      if(poisoned||Object.entries(tasks).some(([id,t])=>(id!==taskId&&t.active)||!t.known))throw Error("TASK_UNSETTLED");
      const runtime=runtimes.get(taskId)??createRuntime({model:config.model,transport:createPiTransport({model:config.model,apiKey:config.apiKey,...(options.fetch?{fetch:options.fetch}:{})}),authorize,audit,budgets});
      runtimes.set(taskId,runtime);
      return {async complete(req){
        signal.throwIfAborted();
        if(!existsSync(auditFile))throw Error("TASK_LEDGER_INVALID");
        if(tasks[taskId]?.active)throw Error("TASK_BUSY");
        tasks[taskId]={active:true,known:false};persist();
        const before=admissions.get(taskId)??0;
        const result=await runtime.runText({taskId,prompt:req.user,system:req.system,limits:config.limits,modelRecovery:{extraAttempts:1},signal});
        // Keep the persistent unknown marker if idle waiting or persistence fails.
        await runtime.waitForIdle(taskId);
        // An admitted request interrupted before a terminal response may still be billed.
        // SDK-local idle/usage alone does not prove provider-side settlement.
        const interrupted=(admissions.get(taskId)??0)>before && result.status!=="succeeded" &&
          (signal.aborted || ["CANCELLED","DEADLINE_EXCEEDED","MODEL_FAILED"].includes(result.reason));
        tasks[taskId]={active:false,known:result.usageKnown&&!interrupted};persist();
        if(result.status!=="succeeded")throw Error(`模型调用未完成（${result.reason}）；任务 ${taskId}`);
        return {text:result.value,taskId,provider:config.model.provider,model:config.model.id,usage:result.usageKnown?{modelCalls:result.usage.modelCalls,inputTokens:result.usage.inputTokens,outputTokens:result.usage.outputTokens}:undefined};
      }};
    },
    async settled(taskId:string){await runtimes.get(taskId)?.waitForIdle(taskId);return !poisoned&&(!tasks[taskId]||(!tasks[taskId].active&&tasks[taskId].known));}
  };
}
