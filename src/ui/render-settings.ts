import { chip, escapeHtml } from "./render.js";

// 密钥来源标签（G9a：四标签钉死，chip 色按契约 §4）
type KeySourceLabel = "process" | "env-file" | "discovery" | "default-chain" | "missing";

export interface ChainEntry {
  spec: string;
  role: string;
  source: KeySourceLabel;
  keyMasked?: string;
}

// LLM 连接状态（由 server 端试构造 client 得出，不含 key 明文）
export interface LlmStatus {
  mode: "configured" | "faux" | "unconfigured" | "error";
  model?: string;
  /** 链首原始 spec（首页芯片「就绪 · <生效主模型>」用，不带 (+N 备) 后缀） */
  mainSpec?: string;
  keyMasked?: string;
  baseUrl?: string;
  error?: string;
  /** G5：.env.local 有值但被进程环境同名值覆盖的键（遮蔽警告；只含变量名，不含任何 key 值） */
  shadowedKeys?: string[];
  /** D9/G9：生效模型来源（default-chain = 零配置默认链） */
  modelSource?: "process" | "env-file" | "default-chain";
  /** D9/G9：当前生效链全表（每候选来源标签 + 打码；缺 key 候选标 missing） */
  chain?: ChainEntry[];
  gateway?: { url: string; source: "process" | "env-file" };
  /** G9b：链外 pi CLI 凭据 provider 名（永不含 key） */
  otherProviders?: string[];
}

export interface SettingsValues {
  model?: string;
  baseUrl?: string;
}

const SOURCE_LABEL: Record<KeySourceLabel, string> = {
  process: "环境变量",
  "env-file": ".env.local",
  discovery: "自动发现 · pi CLI",
  "default-chain": "默认链",
  missing: "缺失（调用时自动跳过）"
};

const SOURCE_CHIP: Record<KeySourceLabel, "ok" | "warn" | "queue" | "accent"> = {
  process: "queue",
  "env-file": "accent",
  discovery: "ok",
  "default-chain": "ok",
  missing: "warn"
};

const MODEL_SOURCE_NOTE: Record<"process" | "env-file" | "default-chain", string> = {
  "default-chain": "默认链自动启用（未手动设置 MF_LLM_MODEL）",
  "env-file": ".env.local（手动配置）",
  process: "环境变量（手动配置）"
};

export function settingsPage(
  status: LlmStatus,
  opts: { errors?: string[]; values?: SettingsValues; banner?: "saved" | "cleared" } = {}
): string {
  const errorsHtml = opts.errors?.length
    ? `<ul class="error-list" id="settings-issues" role="alert">${opts.errors.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>`
    : "";

  // 一次性横幅（G6/契约反馈机制）：303 携带 ?saved=1/?cleared=1，裸 GET 不渲染
  const bannerHtml =
    opts.banner === "saved"
      ? `<div class="card banner banner-ok"><strong>已保存</strong>覆盖配置已写入 .env.local（显式配置优先于自动发现）。</div>`
      : opts.banner === "cleared"
        ? `<div class="card banner banner-ok"><strong>已清除覆盖</strong>回退自动发现（默认链将按本机 pi CLI 凭据自动启用）。</div>`
        : "";

  const stateHtml =
    status.mode === "configured"
      ? `<p>${chip("ok", "就绪")} <span class="mono">${escapeHtml(status.model ?? "")}</span>
         ${status.baseUrl ? ` · 网关 <span class="mono">${escapeHtml(status.baseUrl)}</span>` : ""}</p>`
      : status.mode === "faux"
        ? `<p>${chip("accent", "演示模式")} 当前使用确定性 faux 后端（零网络），供体验与测试；配置真实模型后自动切换。faux 不读取本机凭据。</p>`
        : status.mode === "error"
          ? `<p>${chip("fail", "配置错误")}</p><ul class="error-list" role="alert"><li>${escapeHtml(status.error ?? "")}</li></ul>`
          : `<p>${chip("queue", "未配置")} 本机已有 pi CLI 凭据即可零配置直接使用；或填写下方表单手动配置（不配置也可用模板微调全流程）。配置仅存本机。</p>`;

  // G5 遮蔽警告（契约置于链卡）：.env.local 值被进程环境覆盖的键点名（显式配置优先，需先 unset）
  const shadowHtml = status.shadowedKeys?.length
    ? `<ul class="error-list" role="alert">${status.shadowedKeys
        .map(
          (k) =>
            `<li>遮蔽警告 ${escapeHtml(k)}：.env.local 保存的值被进程环境变量同名值覆盖（显式配置优先），需先 unset 才生效</li>`
        )
        .join("")}</ul>`
    : "";

  // 链卡「当前生效链（查看）」（G9a/G9b；faux 不显示——D10 短路，不触发现层）
  let chainCard: string;
  if (status.mode === "faux") {
    chainCard = "";
  } else if (status.chain && status.chain.length > 0) {
    const rows = status.chain
      .map(
        (c) => `<tr>
          <td>${escapeHtml(c.role)}</td>
          <td class="mono">${escapeHtml(c.spec)}</td>
          <td>${chip(SOURCE_CHIP[c.source], SOURCE_LABEL[c.source])}</td>
          <td class="mono">${c.keyMasked ? escapeHtml(c.keyMasked) : "—"}</td>
        </tr>`
      )
      .join("");
    const gatewayHtml = status.gateway
      ? `<p>网关 MF_LLM_BASE_URL = <span class="mono">${escapeHtml(status.gateway.url)}</span>（${escapeHtml(status.gateway.source === "process" ? "环境变量" : ".env.local")}）</p>`
      : "";
    const otherHtml = status.otherProviders?.length
      ? `<p>另检测到 ${status.otherProviders.length} 个 pi CLI 凭据：${status.otherProviders.map(escapeHtml).join("、")}（手配对应模型即可用）</p>`
      : "";
    chainCard = `<div class="card"><div class="card-h">当前生效链（查看）</div>
      <p>生效模型来源：${escapeHtml(MODEL_SOURCE_NOTE[status.modelSource ?? "process"])}</p>
      <div style="padding:0;overflow-x:auto"><table class="tbl">
        <thead><tr><th scope="col">角色</th><th scope="col">模型</th><th scope="col">密钥来源</th><th scope="col">密钥</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      ${gatewayHtml}${otherHtml}${shadowHtml}</div>`;
  } else {
    chainCard = `<div class="card"><div class="card-h">当前生效链（查看）</div>
      <p>未配置——本机已有 pi CLI 凭据（含已验证候选 key）时默认链将自动启用；或去下方表单手动配置。</p>${shadowHtml}</div>`;
  }

  // G9c：表单 value 永远留空（查看与覆盖物理分离），placeholder 承载当前生效模型
  const modelPlaceholder =
    status.mode === "configured"
      ? `当前生效：${status.model ?? ""}`
      : status.mode === "error"
        ? `当前保存：${status.model ?? ""}（未生效）`
        : "如 minimax-cn/MiniMax-M3";

  const form = `<form action="/settings/save" method="post">
    <div class="card">
      <div class="card-h">模型配置（覆盖）</div>
      ${errorsHtml}
      <div class="fld"><label for="set-model">模型（provider/model-id，如 minimax-cn/MiniMax-M3、openai/gpt-4o）</label>
        <input type="text" id="set-model" name="model" placeholder="${escapeHtml(modelPlaceholder)}" value=""${opts.errors?.length ? ' aria-invalid="true" aria-describedby="settings-issues"' : ""}>
        <p style="color:var(--text-2);font-size:0.78rem;margin:0.25rem 0 0">模型留空保存 = 清除覆盖、回退自动发现（与下方「清除配置」等效）</p></div>
      <div class="fld"><label for="set-key">API Key（${status.keyMasked ? `当前生效已打码 ${escapeHtml(status.keyMasked)}，留空则不修改` : "按模型 provider 自动存为对应环境变量；仅存本机 .env.local，页面不回显"}）</label>
        <input type="password" id="set-key" name="api_key" placeholder="${status.keyMasked ? "留空保持不变" : "sk-…"}" autocomplete="off"></div>
      <div class="fld"><label for="set-base">网关地址（可选，OpenAI 兼容内部网关覆盖；对内置已验证模型不生效）</label>
        <input type="text" id="set-base" name="base_url" placeholder="${status.baseUrl ? escapeHtml(status.baseUrl) : "https://…"}" value=""></div>
      <button class="btn btn-primary" type="submit">保存配置</button>
    </div>
  </form>`;

  const clear = `<form action="/settings/clear" method="post" class="card">
    <div class="card-h">清除配置</div>
    <p style="color:var(--text-2);font-size:0.82rem">删除本页管理的模型、密钥与网关条目（.env.local 中其他内容不受影响）。</p>
    <button class="btn btn-danger" type="submit">清除本页管理的配置</button>
  </form>`;

  const note = `<p class="composer-note">配置写入仓库根目录 .env.local（已被 git 忽略），工作台与 CLI 共用；密钥不会出现在页面、日志或导出物中。自动发现的密钥仅内存使用、永不写盘。</p>`;

  return `${bannerHtml}<div class="card"><div class="card-h">AI 模型连接</div>${stateHtml}</div>${chainCard}${form}${clear}${note}`;
}
