import { writeFile } from "node:fs/promises";
import { stringify as stringifyYaml } from "yaml";
import type { Instance } from "../schema/instance.js";

export async function writeInstanceFile(path: string, inst: Instance): Promise<void> {
  const header = `# Metric Factory 企业实例（fork 自 ${inst.base}）\n`;
  await writeFile(path, header + stringifyYaml(inst), "utf8");
}
