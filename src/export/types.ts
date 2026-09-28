import type { MaterializedInstance } from "../engine/materialize.js";

// 导出器插件契约：三格式（metricflow / excel / mermaid）共用同一接口
export interface ExportResult {
  filename: string;
  content: string | Uint8Array;
}

export interface Exporter {
  format: string;
  export(input: MaterializedInstance): Promise<ExportResult>;
}
