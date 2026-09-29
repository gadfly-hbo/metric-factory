import { readFile } from "node:fs/promises";

export interface WarehouseColumn {
  name: string;
  type?: string;
  source: "manifest" | "catalog";
}

export interface WarehouseModel {
  name: string;
  columns: WarehouseColumn[];
  missingColumns: boolean;
}

export interface Warehouse {
  models: WarehouseModel[];
}

interface RawNode {
  resource_type?: string;
  name?: string;
  columns?: Record<string, { name?: string; data_type?: string; type?: string }>;
}

function locate(path: string, e: unknown): Error {
  return new Error(`无法解析 dbt artifact ${path}：${(e as Error).message}`);
}

function readNodes(doc: unknown, path: string): Record<string, RawNode> {
  const nodes = (doc as { nodes?: unknown })?.nodes;
  if (!nodes || typeof nodes !== "object") {
    throw new Error(`dbt artifact ${path} 缺少 nodes 结构（确认是 manifest.json / catalog.json）`);
  }
  return nodes as Record<string, RawNode>;
}

// 双输入解析：manifest 提供模型与声明列，catalog（dbt docs generate）提供全量列；
// 同名列以 catalog 为准，模型在两处皆无列时标记 missingColumns
export async function parseDbtArtifacts(manifestPath: string, catalogPath?: string): Promise<Warehouse> {
  let manifestDoc: unknown;
  try {
    manifestDoc = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (e) {
    throw locate(manifestPath, e);
  }
  const manifestNodes = readNodes(manifestDoc, manifestPath);

  let catalogNodes: Record<string, RawNode> = {};
  if (catalogPath) {
    let catalogDoc: unknown;
    try {
      catalogDoc = JSON.parse(await readFile(catalogPath, "utf8"));
    } catch (e) {
      throw locate(catalogPath, e);
    }
    catalogNodes = readNodes(catalogDoc, catalogPath);
  }

  const models: WarehouseModel[] = [];
  for (const [uniqueId, node] of Object.entries(manifestNodes)) {
    if (node.resource_type !== "model" || !node.name) continue;

    const columns = new Map<string, WarehouseColumn>();
    for (const col of Object.values(node.columns ?? {})) {
      if (!col?.name) continue;
      columns.set(col.name, { name: col.name, type: col.data_type, source: "manifest" });
    }
    const catalogNode = catalogNodes[uniqueId];
    for (const col of Object.values(catalogNode?.columns ?? {})) {
      if (!col?.name) continue;
      columns.set(col.name, { name: col.name, type: col.type ?? col.data_type, source: "catalog" });
    }

    models.push({
      name: node.name,
      columns: [...columns.values()],
      missingColumns: columns.size === 0
    });
  }

  return { models };
}
