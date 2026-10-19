import {createHash} from "node:crypto";
import {lstat, realpath, readdir} from "node:fs/promises";
import {isAbsolute, join} from "node:path";
/** Personal local-process boundary; rejects persistent redirects, not an OS sandbox. */
export async function assertIntegratedDataTree(root:string):Promise<void> {
 if(!isAbsolute(root)||await realpath(root)!==root)throw Error("DATA_ROOT_REDIRECTED");
 const walk=async(path:string):Promise<void>=>{
  const st=await lstat(path);
  if(st.isSymbolicLink()||(!st.isFile()&&!st.isDirectory())||(st.isFile()&&st.nlink!==1))throw Error("DATA_LINK_DENIED");
  if(st.isDirectory())for(const child of await readdir(path))await walk(join(path,child));
 };
 await walk(root);
}
export function validInstanceId(id:string):boolean {
 return id.length<256&&!id.includes("\\")&&!id.includes("\0")&&!isAbsolute(id)&&id.split("/").every(p=>p!==""&&p!=="."&&p!=="..")&&id.endsWith("instance.yaml");
}

/** Stable within the dedicated workspace, independent of labels or basename collisions. */
export function integratedPackageId(instanceId:string):string {
 if(!validInstanceId(instanceId))throw Error("INSTANCE_ID_INVALID");
 return "system-"+createHash("sha256").update(instanceId).digest("hex");
}
