import {readFileSync, lstatSync, realpathSync} from "node:fs";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {parse} from "yaml";
import {ReleaseIndexSchema} from "../sap/release.js";
import {contentFingerprint, type SapPackage} from "../sap/canonical.js";
import {validateSapPackage} from "../sap/validate.js";
export function readPublished(releases:string,packageId:string,version:string) {
 if(!/^[a-z][a-z0-9-]*$/.test(packageId)||!/^\d+\.\d+\.\d+$/.test(version))throw Error("RELEASE_ID_INVALID");
 const read=(path:string)=>{const st=lstatSync(path);if(!st.isFile()||st.nlink!==1||realpathSync(path)!==path||st.size>32*1024*1024)throw Error("RELEASE_FILE_INVALID");return readFileSync(path);};
 const index=ReleaseIndexSchema.parse(parse(read(join(releases,"index.yaml")).toString("utf8")));
 const rows=index.releases.filter(r=>r.package===packageId&&r.version===version);
 if(rows.length!==1)throw Error("RELEASE_UNKNOWN");
 const row=rows[0]!;if(row.file!==`${packageId}/${version}.sap.yaml`)throw Error("RELEASE_PATH_INVALID");
 const bytes=read(join(releases,row.file)),pkg=parse(bytes.toString("utf8")) as SapPackage;
 if(validateSapPackage(pkg).length||pkg.package.id!==packageId||pkg.package.version!==version||pkg.package.fingerprint!==row.package_fingerprint||contentFingerprint(pkg)!==row.content_fingerprint)throw Error("RELEASE_BYTES_CHANGED");
 return {packageId,version,contentFingerprint:row.content_fingerprint,packageFingerprint:row.package_fingerprint,sha256:createHash("sha256").update(bytes).digest("hex"),bytes:bytes.toString("base64")};
}
