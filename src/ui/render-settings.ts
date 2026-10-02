import { chip, escapeHtml } from "./render.js";

// LLM 连接状态（由 server 端试构造 client 得出，不含 key 明文）
export interface LlmStatus {
  mode: "configured" | "faux" | "unconfigured" | "error";
  model?: string;
  keyMasked?: string;
  baseUrl?: string;
  error?: string;
}

export interface SettingsValues {
  model?: string;
  baseUrl?: string;
}

export function settingsPage(status: LlmStatus, opts: { errors?: string[]; values?: SettingsValues } = {}): string {
  const errorsHtml = opts.errors?.length
    ? `<ul class="error-list">${opts.errors.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>`
    : "";

  const stateHtml =
    status.mode === "configured"
      ? `<p>${chip("ok", "模型已连接")} <span class="mono">${escapeHtml(status.model ?? "")}</span>
         ${status.keyMasked ? ` · 密钥 <span class="mono">${escapeHtml(status.keyMasked)}</span>` : " · 密钥来自进程环境"}
         ${status.baseUrl ? ` · 网关 <span class="mono">${escapeHtml(status.baseUrl)}</span>` : ""}</p>`
      : status.mode === "faux"
        ? `<p>${chip("accent", "演示模式")} 当前使用确定性 faux 后端（零网络），供体验与测试；配置真实模型后自动切换。</p>`
        : status.mode === "error"
          ? `<p>${chip("warn", "配置有误")} ${escapeHtml(status.error ?? "")}</p>`
          : `<p>${chip("warn", "未配置")} AI 草案功能需要模型配置；填好下方表单即可使用，配置仅存本机。</p>`;

  const form = `<form action="/settings/save" method="post">
    <div class="card">
      <div class="card-h">模型配置</div>
      ${errorsHtml}
      <div class="fld"><label>模型（provider/model-id，如 openai/gpt-4o、anthropic/claude-sonnet-4）</label>
        <input type="text" name="model" placeholder="openai/gpt-4o" value="${escapeHtml(opts.values?.model ?? "")}" required></div>
      <div class="fld"><label>API Key（${status.keyMasked ? `已保存 ${escapeHtml(status.keyMasked)}，留空则不修改` : "按模型 provider 自动存为对应环境变量；仅存本机 .env.local，页面不回显"}）</label>
        <input type="password" name="api_key" placeholder="${status.keyMasked ? "留空保持不变" : "sk-…"}" autocomplete="off"></div>
      <div class="fld"><label>网关地址（可选，OpenAI 兼容内部网关覆盖）</label>
        <input type="text" name="base_url" placeholder="https://…" value="${escapeHtml(opts.values?.baseUrl ?? "")}"></div>
      <button class="btn btn-primary" type="submit">保存配置</button>
    </div>
  </form>`;

  const clear = `<form action="/settings/clear" method="post" class="card">
    <div class="card-h">清除配置</div>
    <p style="color:var(--text-2);font-size:12px">删除本页管理的模型、密钥与网关条目（.env.local 中其他内容不受影响）。</p>
    <button class="btn btn-danger" type="submit">清除本页管理的配置</button>
  </form>`;

  const note = `<p class="composer-note">配置写入仓库根目录 .env.local（已被 git 忽略），工作台与 CLI 共用；密钥不会出现在页面、日志或导出物中。</p>`;

  return `<div class="card"><div class="card-h">AI 模型连接</div>${stateHtml}</div>${form}${clear}${note}`;
}
