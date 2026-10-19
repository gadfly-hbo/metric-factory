// vitest(TS) 导入 flows.mjs 的类型声明（进程内 oracle 复用）
export interface OracleViewResult {
  [view: string]: string;
}
export interface OracleBehavior {
  dialogOpensNative: boolean;
  escClosesDialog: boolean;
  focusReturnsToOpener: boolean;
  n390NoOverflowWork: boolean | "skipped";
  skipLinkPresent: boolean;
}
export interface OracleResults {
  mode: string;
  base: string;
  views: OracleViewResult;
  behavior: OracleBehavior;
  ok: boolean;
}
export declare function runOracle(opts: {
  base: string;
  mode?: "update" | "compare";
  viewFilter?: string;
  baselineDir?: string;
  launchOptions?: Record<string, unknown>;
  /** 产品端（URL base）：work 视图 hash 直开的实例相对路径 */
  openInstance?: string;
}): Promise<OracleResults>;
