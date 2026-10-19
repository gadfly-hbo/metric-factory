/* Product/UI review prototype. Synthetic examples, memory only, no Provider or production API. */
"use strict";
const $ = (s, root = document) => root.querySelector(s);
const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const copy = x => JSON.parse(JSON.stringify(x));
const sampleNeed = "我们是服饰电商品牌，希望建立一套经营指标体系。重点看净销售额、退款和客户复购，按渠道与品类做每周复盘，知道增长有没有质量。";
const baseMetrics = [
  {id:"gmv",name:"成交总额",group:"销售增长",description:"成功支付订单的商品成交金额，包含后来发生退款的订单。",formula:"合格订单商品金额相加",unit:"元",note:"运费单独列示，不计入商品金额。"},
  {id:"net_sales",name:"净销售额",group:"销售增长",description:"成交总额扣除已完成退款金额，观察实际保留下来的销售规模。",formula:"成交总额 − 退款额",unit:"元",note:"退款金额归属哪个期间，会影响每周的净销售结果。",pending:"refund"},
  {id:"order_count",name:"支付订单数",group:"销售增长",description:"成功支付的订单数量，包含后来发生退款的订单。",formula:"按订单去重计数",unit:"单"},
  {id:"aov",name:"客单价",group:"销售增长",description:"每笔成功支付订单的平均商品成交金额。",formula:"成交总额 ÷ 支付订单数",unit:"元／单"},
  {id:"customers",name:"支付客户数",group:"客户质量",description:"观察期间内有成功支付订单的客户数量，同一客户只计一次。",formula:"按支付客户去重计数",unit:"人"},
  {id:"repeat_customers",name:"复购客户数",group:"客户质量",description:"在约定观察窗口内，至少完成两笔成功支付订单的客户数量。",formula:"符合复购条件的客户去重计数",unit:"人",pending:"repeat"},
  {id:"repeat_rate",name:"客户复购率",group:"客户质量",description:"观察窗口内，有过再次购买的支付客户占比。",formula:"复购客户数 ÷ 支付客户数",unit:"%",note:"需使用相同客户队列与观察窗口。",pending:"repeat"},
  {id:"refund_amount",name:"退款额",group:"经营风险",description:"已完成退款的商品金额，不包含申请中或已取消的退款。",formula:"合格已完成退款金额相加",unit:"元",pending:"refund"},
  {id:"refunded_orders",name:"退款订单数",group:"经营风险",description:"支付订单中，截至观察截止至少有一笔完成退款的订单数；多次退款只计一单。",formula:"已发生完成退款的支付订单去重计数",unit:"单"},
  {id:"refund_rate",name:"订单退款率",group:"经营风险",description:"同一支付订单队列中，发生过完成退款的订单占比。",formula:"退款订单数 ÷ 支付订单数",unit:"%",note:"与退款金额占比不同；分母为零时显示证据不足。"}
];
const methods = [
  {id:"net-change",type:"method",name:"净销售额变化拆解",description:"比较两段期间，把净额变化拆为成交侧与退款侧，再检查退款护栏。",source:"内置示例",roles:["结果指标","成交侧指标","退款侧指标","风险护栏"],purpose:"净销售变化主要来自成交规模，还是退款金额？",steps:["看净销售整体变化","拆成交侧与退款侧","按品类、渠道比较","检查退款风险与限制"],metricIds:["net_sales","gmv","refund_amount","refund_rate"]},
  {id:"repeat-review",type:"method",name:"客户复购表现复盘",description:"观察同一客户队列的复购表现，分清客户规模与复购质量的变化。",source:"内置示例",roles:["结果指标","客户规模","复购客户"],purpose:"客户增长是否带来了持续购买？",steps:["确定客户队列与观察窗口","比较复购表现","按渠道检查差异","披露证据与限制"],metricIds:["repeat_rate","customers","repeat_customers"]},
  {id:"weekly-review",type:"method",name:"经营周报分析",description:"按规模、客户和风险三个方面整理经营变化，形成可复查的周报结构。",source:"内置示例",roles:["经营结果","客户质量","风险护栏"],purpose:"本周经营有哪些值得关注的变化？",steps:["看整体经营","比较客户质量","检查经营风险","整理关注点"],metricIds:["net_sales","repeat_rate","refund_rate"]},
  ...analysisMethodTemplates
];
const initialTemplates = [
  {id:"ecommerce",type:"metric",name:"电商经营指标体系",description:"围绕销售增长、客户质量与经营风险组织核心指标。",source:"内置示例",metricIds:baseMetrics.map(m=>m.id),groups:3},
  {id:"revenue",type:"metric",name:"收入与退款指标体系",description:"聚焦成交、净额、订单与退款，适合先做一套精简体系。",source:"内置示例",metricIds:["gmv","net_sales","order_count","refund_amount","refunded_orders","refund_rate"],groups:2},
  {id:"customer",type:"metric",name:"客户复购指标体系",description:"用同一客户队列观察支付客户、复购人数与复购率。",source:"内置示例",metricIds:["customers","repeat_customers","repeat_rate"],groups:1}
];
const state = {route:"home",stage:"overview",systems:[],active:null,homeDraft:sampleNeed,libraryType:"metric",filter:"all",search:"",templates:copy(initialTemplates),methodTemplates:copy(methods),busy:false,importRows:null,importFile:"",importError:"",metricView:"tree",toastTimer:null};
const current = () => state.systems.find(s=>s.id===state.active);
const metricById = id => current()?.metrics.find(m=>m.id===id);
const pendingLabels = s => [...(s.pending.refund===null?["退款归属期间"]:[]),...(s.pending.repeat===null?["复购观察窗口"]:[]),...s.metrics.filter(m=>!m.description.trim()).map(m=>`${m.name}的统计说明`)];
const pendingCount = s => pendingLabels(s).length;
const metricName = id => metricById(id)?.name || "尚未绑定";
const btn = (label,action,cls="",attrs="") => `<button class="btn ${cls}" data-action="${action}" ${attrs}>${label}</button>`;
const tag = (label,cls="")=>`<span class="tag ${cls}">${label}</span>`;
let modalReturn = null;
let generateTimer = null;

function createSystem(opts={}) {
  const need=opts.need||sampleNeed,preset=inferAnalysisPreset(need),blueprint=makeAnalysisBlueprint(preset);
  const defaults=preset==="strategy"?[]:preset==="operating"?profitMetrics:preset==="data"?baseMetrics.filter(m=>["customers","repeat_customers","repeat_rate"].includes(m.id)):baseMetrics;
  const metrics=copy(opts.metrics===undefined?defaults:opts.metrics);
  const id=`system-${Date.now()}-${state.systems.length}`;
  const pending={};
  if(metrics.some(m=>m.pending==="refund")) pending.refund=null;
  if(metrics.some(m=>m.pending==="repeat")) pending.repeat=null;
  if(opts.source){blueprint.purpose=opts.goal||blueprint.purpose;blueprint.questions=[{title:"这些指标要服务什么业务判断？",detail:"结合模板的适用业务，补充目标、比较对象与分析用途。",metricRefs:metrics.map(m=>m.id)}];}
  else for(const q of blueprint.questions)q.metricRefs=q.metricRefs.filter(ref=>metrics.some(m=>m.id===ref));
  const system={id,title:opts.title||blueprint.title,goal:opts.goal||blueprint.purpose,need,blueprint,metrics,scenes:copy(opts.scenes||[]),pending,confirmed:false,revision:1,delivered:null,chat:[],proposal:null,metricOnly:false,source:opts.source||"AI 草稿 · 合成演示"};
  state.systems.unshift(system);state.active=id;
  if(blueprint.intent==="设计具体分析方案"&&opts.scenes===undefined)createScene(methods.find(m=>m.id===blueprint.methodId));
  return system;
}

function setRoute(route,stage){state.route=route;if(stage)state.stage=stage;closeMenu();render(false);window.scrollTo({top:0,behavior:"instant"});$("#main").focus({preventScroll:true});}
function openSystem(id,stage="overview"){state.active=id;state.metricView="tree";setRoute("work",stage);}
function render(preserveScroll=true){
  const y=preserveScroll?window.scrollY:0;
  const s=current();
  $("#system-count").textContent=state.systems.length;
  $("#recent").innerHTML=state.systems.length ? state.systems.slice(0,5).map(x=>`<button class="recent-item ${state.route==="work"&&x.id===state.active?"active":""}" data-action="open-system" data-id="${x.id}">${esc(x.title)}<span>${x.delivered?`已交付 · ${esc(x.delivered.version)}`:"工作草稿"}</span></button>`).join("") : '<p class="fine nav-empty">从一句业务需求开始。</p>';
  document.querySelectorAll(".nav-primary .nav-item").forEach(el=>el.classList.toggle("active",(el.dataset.action==="systems"&&["systems","work"].includes(state.route))||(el.dataset.action==="library"&&state.route==="library")));
  const crumb=state.route==="home"?"开始创建":state.route==="systems"?"我的体系":state.route==="library"?"模板库":state.route==="generating"?"生成草稿":s?.title||"开始创建";
  $("#breadcrumb").innerHTML=`工作空间 <span>/</span> ${esc(crumb)}`;
  $("#main").innerHTML=state.route==="home"?renderHome():state.route==="generating"?renderGenerating():state.route==="systems"?renderSystems():state.route==="library"?renderLibrary():s?renderWork(s):renderHome();
  requestAnimationFrame(()=>window.scrollTo(0,y));
}

function renderHome(){return `<section class="home">
  <div class="eyebrow">从业务需求开始</div>
  <h1>你想弄清什么，或做出什么选择？</h1>
  <p class="home-intro">从一句业务需求开始。AI 帮你组织问题、假设、指标与证据，一起设计怎样形成可信的判断。</p>
  <div class="composer">
    <label for="need">描述你的业务与需求</label>
    <textarea id="need" placeholder="可以是一个经营问题、一项重大选择，或一套想建立的指标体系……">${esc(state.homeDraft)}</textarea>
    <div class="composer-bottom"><span class="fine">先用自己的话说，不必先选择分析类别。<br>示例生成与后续检查均为合成演示。</span>${btn('生成体系草稿 <span aria-hidden="true">↗</span>',"generate","primary")}</div>
    <p class="inline-error" id="home-error" role="alert" hidden></p>
  </div>
  <div class="home-paths"><span>也可以从已有积累开始</span>${btn('浏览模板库 <span aria-hidden="true">→</span>',"library","small quiet")}<span class="divider"></span>${btn("导入我的指标模板","import","small quiet")}</div>
  <div class="section-label"><h2>试试这样描述</h2><span class="fine">点击填入，随时改写</span></div>
  <div class="starter-list">
    ${analysisExamples.map((example,i)=>`<button class="starter-row" data-action="example" data-index="${i}"><span class="starter-number">0${i+1}</span><div><strong>${esc(example.name)}</strong><p>${esc(example.hint)}</p></div><span class="arrow" aria-hidden="true">↗</span></button>`).join("")}
  </div>
  <div class="home-bottom"><span class="green" aria-hidden="true">◇</span><p class="fine">经营与战略说明服务什么判断，数据分析提供共同的方法和证据能力。指标、研究与业务知识按需要组合，关键假设不会自动变成事实。</p></div>
</section>`;}

function renderGenerating(){return `<section class="busy-block" aria-live="polite" aria-busy="true"><span class="spinner" aria-hidden="true"></span><div class="eyebrow">合成交互演示</div><h1>正在整理一套可讨论的分析设计</h1><p>梳理业务目的、问题和待验证假设，再组织适用的指标、方法与证据要求。</p><div class="detail-rule">${esc(state.homeDraft)}</div><p class="fine">原型根据预设案例展示交互；未知内容不视为已确认事实，不会调用模型。</p><div class="actions" style="margin-top:22px">${btn("停止演示","stop-generation")}</div></section>`;}

function renderSystems(){return `<section class="page"><div class="page-heading"><div><h1>我的分析体系</h1><p>让业务目的、问题、指标、方法与证据共同形成可维护资产。</p></div>${btn("＋ 创建分析体系","home","primary")}</div>${state.systems.length?`<div class="system-list">${state.systems.map(s=>`<div class="system-row"><div class="system-icon" aria-hidden="true">▤</div><div><h2>${esc(s.title)}</h2><p>${s.metrics.length} 个指标 · ${s.scenes.length} 个分析场景 · ${esc(s.source)}</p></div><div class="row-end">${tag(s.delivered?`已交付 ${esc(s.delivered.version)}`:"工作草稿",s.delivered?"":"neutral")}${btn("继续编辑 →","open-system","",`data-id="${s.id}"`)}</div></div>`).join("")}</div>`:`<div class="empty-state"><h2>还没有分析体系</h2><p>用一句话描述业务问题或建设需求，或从模板库创建自己的第一套体系。</p><div class="actions" style="margin-top:22px">${btn("描述需求","home","primary")}${btn("从模板开始","library")}</div></div>`}<p class="prototype-note">此原型仅保留当前页面内的演示内容，刷新后重置。</p></section>`;}

function renderWork(s){
  const body=state.stage==="overview"?renderOverview(s):state.stage==="metrics"?renderMetrics(s):state.stage==="scenes"?renderScenes(s):renderReview(s);
  return `<div class="work-header"><div class="page-heading"><div><div class="system-title"><h1>${esc(s.title)}</h1>${tag(s.delivered?(s.revision>s.delivered.revision?"有新工作草稿":"已交付版本"):"工作草稿","neutral")}</div><div class="system-meta"><span>${s.metrics.length} 个指标</span><span>${s.scenes.length} 个分析场景</span><span>${s.delivered?`上次交付 ${esc(s.delivered.version)} · 当前可继续编辑`:`${esc(s.source)}`}</span></div></div><div class="actions">${btn("修改名称","rename","small quiet")}${btn("保存工作草稿","save-draft")}</div></div></div>
  <nav class="work-tabs" aria-label="体系工作视图">${[["overview","体系总览"],["metrics","指标体系"],["scenes","场景与方法"],["review","检查与交付"]].map(([key,label],i)=>`<button class="tab ${state.stage===key?"active":""}" ${state.stage===key?'aria-current="page"':""} data-action="stage" data-stage="${key}"><span class="step-number">0${i+1}</span>${label}</button>`).join("")}</nav>
  <div class="work-content"><section class="work-main" aria-label="${state.stage==="overview"?"分析体系总览":state.stage==="metrics"?"指标体系内容":state.stage==="scenes"?"分析场景内容":"设计检查与交付"}">${body}</section>${renderAssistant(s)}</div>`;
}

function renderOverview(s){const b=s.blueprint;return `
  <div class="understanding"><div class="subsection-title"><div class="eyebrow">我理解的业务需求</div>${btn("修正我的理解","edit-understanding","small quiet")}</div><h2>${esc(b.decision)}</h2><p>${esc(b.purpose)}</p><div class="context-row">${b.contexts.map(c=>tag(esc(c))).join("")}${tag(esc(b.intent),"neutral")}</div><p class="fine">语境可组合、可修正；此处是设计建议，不是已核验的业务结论。</p></div>
  <div class="scope-note"><strong>这份设计的边界</strong><p>${esc(b.boundary)}</p></div>
  <section class="subsection"><div class="subsection-title"><h3>把问题拆成可以研究的部分</h3><span class="fine">${b.questions.length} 个问题</span></div><ol class="question-outline">${b.questions.map((q,i)=>`<li><span class="number">${i+1}</span><div><strong>${esc(q.title)}</strong><p>${esc(q.detail)}</p>${q.metricRefs.length?`<div class="binding-chips">${q.metricRefs.map(id=>`<button class="binding-chip" data-action="metric" data-id="${id}">${esc(metricName(id))} ↗</button>`).join("")}</div>`:'<span class="fine">结合研究与业务证据，按需补充量化衡量。</span>'}</div></li>`).join("")}</ol></section>
  <section class="subsection"><div class="subsection-title"><h3>需要检验的关键假设</h3>${btn("查看判断边界","claim-boundaries","small quiet")}</div><div class="hypothesis-list">${b.hypotheses.map((h,i)=>`<article class="hypothesis"><div class="hypothesis-head"><span class="fine">H${i+1}</span>${tag(esc(h.kind),"warn")}</div><h4>${esc(h.text)}</h4><div class="hypothesis-evidence"><div><span>寻找支持</span><p>${esc(h.support)||"尚未定义"}</p></div><div><span>寻找反证</span><p>${esc(h.counter)||"尚未定义"}</p></div></div><p class="change-condition"><strong>何时改变判断</strong> ${esc(h.change)||"尚未定义"}</p><div class="actions">${btn("完善检验条件","edit-hypothesis","small quiet",`data-index="${i}"`)}${btn("查看证据能否支持判断","verify-claim","small quiet",`data-index="${i}"`)}</div></article>`).join("")}</div></section>
  ${b.options.length?`<section class="subsection"><div class="subsection-title"><h3>要比较的候选道路</h3><span class="fine">尚未选择或批准投入</span></div><div class="option-list">${b.options.map(o=>`<div><strong>${esc(o.name)}</strong><p>${esc(o.tradeoff)}</p></div>`).join("")}</div></section>`:""}
  <section class="subsection"><div class="subsection-title"><h3>怎样展开调查</h3>${btn("调整调查方式","edit-organization","small quiet")}</div><div class="context-row">${b.organizations.map(o=>tag(esc(o),"neutral")).join("")}</div><p class="note">调查方式与管理目的分开。同一种专业方法可以服务经营、战略或独立数据专题。</p><div class="capability-strip"><span>共享专业能力</span><p>数据分析 · 研究与访谈 · 业务判断 · 证据核验</p></div></section>
  ${renderEvidencePlan(s)}
  <section class="subsection"><div class="subsection-title"><h3>最终需要形成什么</h3></div><p class="output-description">${esc(b.deliverable)}</p><p class="note">${esc(b.judgmentRule)} 实际决策、资源批准与行动执行另由获授权负责人承担。</p></section>
  <div class="section-end"><span class="fine">${s.metrics.length?`${s.metrics.length} 个指标与问题通过引用联动。`:"当前允许先完成定性设计，再按需补充指标。"}</span>${btn(s.metrics.length?"查看关联指标 →":"查看场景与方法 →","stage","primary",`data-stage="${s.metrics.length?"metrics":"scenes"}"`)}</div>`;}

function renderEvidencePlan(s){return `<section class="subsection"><div class="subsection-title"><h3>需要怎样的证据</h3><span class="fine">计划完整 ≠ 已取得证据</span></div><div class="evidence-plan">${s.blueprint.evidence.map((e,i)=>`<article class="evidence-row"><div class="evidence-title"><strong>${esc(e.name)}</strong>${tag(esc(e.status),"neutral")}</div><p class="evidence-type">${esc(e.kind)}</p><dl><dt>来源</dt><dd>${esc(e.source)||'<span class="missing">尚未说明来源</span>'}</dd><dt>怎样核对</dt><dd>${esc(e.check)||'<span class="missing">尚未定义核验办法</span>'}</dd><dt>不足时</dt><dd>${esc(e.failure)||'<span class="missing">尚未定义不足处置</span>'}</dd></dl>${btn("编辑证据要求","edit-evidence","small quiet",`data-index="${i}"`)}</article>`).join("")}</div></section>`;}

function renderMetrics(s){
  if(!s.metrics.length)return `<div class="empty-state"><div class="eyebrow">指标按问题需要组织</div><h2>先明确判断依据，指标可以随后补充</h2><p>这项战略设计先比较客户价值、竞争方式和能力条件。没有合适的量化定义时，可以保存设计草稿，不必为了填满指标表而编造数值。</p><div class="actions" style="margin-top:22px">${btn("补充量化衡量建议","add-metric","primary")}${btn("回到分析框架","stage","",'data-stage="overview"')}</div></div><p class="note">指标仍是核心可维护资产；需要量化时，可创建指标或从指标模板开始。</p>`;
  const pending=pendingCount(s);
  let groups=[...new Set(s.metrics.map(m=>m.group))];
  return `<div class="objective"><div class="objective-label">这套体系要帮助你</div><p>${esc(s.goal)}</p></div>
  ${pending?`<div class="status-notice"><div><strong>有 ${pending} 个关键口径待确认</strong><p>可以先完善草稿，交付前再集中确认。</p></div>${btn("查看并确认","resolve","small")}</div>`:`<div class="status-notice good"><div><strong>关键业务口径已确认</strong><p>你仍可继续修改，受影响内容会重新标为待确认。</p></div>${btn("查看口径","resolve","small")}</div>`}
  <div class="summary-line"><h2>核心指标结构</h2><div class="view-switch" aria-label="指标展示方式"><button class="${state.metricView==="tree"?"active":""}" data-action="metric-view" data-view="tree" aria-pressed="${state.metricView==="tree"}">结构</button><button class="${state.metricView==="list"?"active":""}" data-action="metric-view" data-view="list" aria-pressed="${state.metricView==="list"}">清单</button></div>${btn("＋ 添加指标","add-metric","small quiet")}</div>
  ${state.metricView==="tree"?`<div class="tree-root"><small>${s.blueprint.contexts.includes("独立数据专题")?"研究用途":"业务用途"}</small><h3>${esc(s.blueprint.decision)}</h3>${tag("点击指标可看解释")}</div><div class="metric-groups">${groups.map(group=>`<section class="metric-group"><div class="group-head">${esc(group)}<span>${s.metrics.filter(m=>m.group===group).length} 项</span></div>${s.metrics.filter(m=>m.group===group).map(m=>metricCard(s,m)).join("")}</section>`).join("")}</div>`:renderMetricTable(s)}
  <div class="section-end"><span class="fine">指标定义只维护一份，场景通过引用使用。</span>${btn('继续设计分析场景 <span aria-hidden="true">→</span>',"stage","primary",'data-stage="scenes"')}</div>`;
}
function metricCard(s,m){return `<button class="metric-card ${m.id==="net_sales"?"selected":""}" data-action="metric" data-id="${m.id}"><strong>${esc(m.name)}</strong>${m.pending&&s.pending[m.pending]===null?'<span class="pending-dot" aria-label="口径待确认"></span>':""}<p>${esc(m.formula)}</p>${m.id==="net_sales"?'<span class="metric-foot">经营结果 · 元</span>':""}</button>`;}
function renderMetricTable(s){return `<div class="table-scroll" role="region" aria-label="指标清单" tabindex="0"><table><thead><tr><th>指标</th><th>业务解释</th><th>计算关系</th></tr></thead><tbody>${s.metrics.map(m=>`<tr><td><button class="link" data-action="metric" data-id="${m.id}">${esc(m.name)}</button><span class="fine">${esc(m.group)} · ${esc(m.unit)}</span></td><td>${esc(m.description)||"待补充统计说明"}</td><td>${esc(m.formula)}</td></tr>`).join("")}</tbody></table></div>`;}

function renderAssistant(s){
  const b=s.blueprint,isOverview=state.stage==="overview",isScene=state.stage==="scenes",isReview=state.stage==="review";
  const intro=isOverview?"先检查我是否理解了你的目的。问题、假设、指标和证据会组成同一份设计，关键假设仍需支持与反对证据。":isReview?"这里检查设计是否完整。证据计划写清楚，不等于已取得证据；实际分析与业务判断尚未发生。":isScene?"方法可以服务不同管理目的。我会按当前问题说明适用条件、证据要求和指标角色。":"指标定义只维护一份，再关联到问题与方法。没有合适量化定义时，可以先保留研究设计。";
  const suggestions=isOverview?(b.contexts.includes("战略选择")?["补充经营落点","把客户访谈加到证据计划","说明什么证据会推翻假设"]:b.contexts.includes("独立数据专题")?["说明因果判断还缺什么","把客户访谈加到证据计划","说明什么证据会推翻假设"]:["补充战略视角","把客户访谈加到证据计划","说明什么证据会推翻假设"]):isScene?["补充证据不足时的处理","说明方法的适用条件"]:isReview?["哪些内容还需要我确认？","设计通过代表结论成立吗？"]:b.preset==="metrics"?["退款按完成时间归属","增加退款金额占比","只保留销售与退款指标"]:["查看问题与指标的关联","补充证据不足时的处理"];
  return `<aside class="assistant" aria-label="AI 共创助手"><div class="assistant-head"><span class="assistant-spark" aria-hidden="true">✧</span><h2>一起完善</h2><span class="meta-right">AI 助手</span></div><div class="assistant-label">${isOverview?"围绕问题设计分析":isReview?"检查设计，不预判结果":isScene?"组合方法与证据":"让指标服务问题"}</div><div class="assistant-message"><p>${intro}</p></div>${s.chat.slice(-2).map(m=>`<div class="assistant-message ${m.role==="user"?"user":""}">${esc(m.text)}</div>`).join("")}${s.proposal?renderProposal(s):`<div class="suggestion-list">${suggestions.map(text=>`<button class="suggestion" data-action="suggest" data-text="${esc(text)}">${esc(text)} <span aria-hidden="true">↗</span></button>`).join("")}</div>`}<div class="assistant-compose"><label for="refine">用自然语言说说你想怎么改</label><textarea id="refine" placeholder="例如：这还涉及增长方向，帮我补上需要验证的假设。"></textarea><div class="assistant-send"><span class="fine">先看建议，再采纳到同一设计</span>${btn("发送 ↑","refine","primary small")}</div></div><p class="note">v0.2 交互演示使用预设内容，不调用模型。</p></aside>`;
}

function renderProposal(s){const p=s.proposal;return `<div class="delta"><h3>修改建议 · ${esc(p.title)}</h3><p class="fine">${esc(p.description)}</p><div class="delta-row"><span class="old">${esc(p.before)}</span><span class="next">${esc(p.after)}</span></div><p class="fine">${esc(p.impact)}</p><div class="actions">${btn("采纳修改","apply-proposal","primary small")}${btn("放弃","discard-proposal","small quiet")}</div></div>`;}

function renderScenes(s){
  const b=s.blueprint,recommended=state.methodTemplates.filter(m=>!m.contexts||m.contexts.some(c=>b.contexts.includes(c)));
  if(!s.scenes.length)return `<div class="empty-state"><div class="eyebrow">把分析框架落到具体场景</div><h2>这次要怎样研究这个问题？</h2><p>方法、证据要求与指标角色共同形成场景。可以从当前框架生成，也可以使用方法模板。</p><div class="composer scene-composer"><label for="scene-need">分析场景需求</label><textarea id="scene-need">${esc(b.decision)}</textarea><div class="composer-bottom"><span class="fine">沿用总览中的业务目的和证据要求。</span>${btn("生成分析场景 ↗","generate-scene","primary")}</div></div></div><div class="method-hints"><h3>可参考的方法模板</h3>${recommended.slice(0,3).map(m=>`<div class="hint-row"><div><strong>${esc(m.name)}</strong><p>${esc(m.description)}</p></div>${btn("预览","preview-template","small",`data-id="${m.id}" data-type="method"`)}</div>`).join("")}</div>`;
  const scene=s.scenes[s.sceneIndex||0];
  return `<div class="scene-switch">${s.scenes.map((x,i)=>`<button class="scene-pill" data-action="select-scene" data-index="${i}" aria-pressed="${(s.sceneIndex||0)===i}">${esc(x.name)}</button>`).join("")}${btn("＋ 新增场景","new-scene","small quiet")}</div><div class="scene-heading"><div><h2>${esc(scene.name)}</h2><p>${esc(scene.purpose)}</p></div><div class="actions">${btn("存为方法模板","save-method-template","small")}</div></div><div class="summary-line">${tag("场景草稿","neutral")}${b.contexts.map(c=>tag(esc(c))).join("")}<span class="fine">${esc(scene.family||"描述分解")} · 设计方法</span></div><section class="subsection"><div class="subsection-title"><h3>准备怎么分析</h3>${btn("修改分析步骤","edit-scene","small quiet")}</div><ol class="step-list">${scene.steps.map((step,i)=>`<li><span class="number">${i+1}</span><div><strong>${esc(step.title)}</strong><p>${esc(step.detail)}</p></div></li>`).join("")}</ol></section><section class="subsection"><div class="subsection-title"><h3>指标怎样参与</h3>${scene.bindings.length?btn("调整绑定","bindings","small quiet"):""}</div>${scene.bindings.length?`<div class="bindings">${scene.bindings.map(binding=>`<div class="binding-row"><span class="binding-role">${esc(binding.role)}</span><div class="binding-chips">${binding.metric?`<button class="binding-chip" data-action="metric" data-id="${binding.metric}">${esc(metricName(binding.metric))} ↗</button>`:tag("尚未绑定","warn")}</div></div>`).join("")}</div>`:'<p class="output-description">此方法可以先比较定性证据与关键假设，不强制绑定量化指标。需要衡量时，再补充明确的指标定义。</p>'}<div class="actions" style="margin-top:15px">${btn(s.metrics.length?"缺少指标？用一句话添加":"补充量化衡量建议","add-metric","small quiet",'data-bind="true"')}</div></section><section class="subsection"><div class="subsection-title"><h3>方法适用性与判断边界</h3></div><p class="output-description">${esc(scene.limit||"只说明计算和描述性变化；缺少合格研究设计时，不形成因果结论。")}</p><p class="note">${esc(scene.evidence||"结合当前体系的证据计划，明确适用来源与核验办法。")}</p></section>${renderEvidencePlan(s)}<div class="section-end"><span class="fine">设计引用、实际证据和运行采用分别表达。</span>${btn("检查并准备交付 →","stage","primary",'data-stage="review"')}</div>`;
}

function renderReview(s){
  const pending=pendingCount(s),missing=missingRequiredBindings(s).length,framework=blueprintIssues(s),metricIssues=prototypeMetricIssues(s),methodIssues=sceneDesignIssues(s),ready=designReady(s),b=s.blueprint;
  return `${s.delivered?`<div class="published"><div class="success-icon" aria-hidden="true">✓</div><h2>演示设计版本已生成</h2><p>业务目的、问题、假设、指标、方法和证据要求已固定为设计快照。它不证明分析结论成立。${s.revision>s.delivered.revision?" 当前工作草稿已有修改，需完成下方检查后生成新版本。":""}</p><dl><dt>设计版本</dt><dd>${esc(s.delivered.version)}</dd><dt>交付范围</dt><dd>${s.delivered.snapshot.metrics.length} 个指标 · ${s.delivered.snapshot.scenes.length} 个场景 · ${s.delivered.snapshot.blueprint.evidence.length} 项证据要求</dd><dt>实际证据</dt><dd>待获取，未执行分析或消费验证</dd></dl><div class="actions">${s.delivered.snapshot.metrics.length?btn("保存指标体系模板","save-metric-template","primary"):btn("保存分析方法模板","save-method-template","primary")}${btn("下载演示设计包","download")}</div></div>`:""}<div class="check-intro"><div class="eyebrow">设计检查</div><h2>${ready?"这份分析设计已准备好交付":"把用途、证据和业务判断连接完整"}</h2><p>检查设计是否可供后续分析使用。证据尚待获取，不代表结论、因果或经营效果已验证。</p></div><div class="checks">
  ${checkRow(!framework.length,"问题、假设与证据计划",framework.length?framework.map(esc).join(" "):`${b.questions.length} 个问题、${b.hypotheses.length} 个待验证假设；已说明支持、反证与不足处置。`,"查看框架","stage",'data-stage="overview"')}
  ${checkRow(!metricIssues.length,"指标定义与计算关系",metricIssues.length?metricIssues.map(esc).join(" "):s.metrics.length?`${s.metrics.length} 个合成指标，预设依赖闭合；真实口径与数据资格另行核验。`:"本次先交付定性研究设计；没有强制补造量化指标。","查看指标","stage",'data-stage="metrics"')}
  ${checkRow(!pending,"需要你确认的业务口径",pending?`${pending} 个待确认项：${pendingLabels(s).map(esc).join("、")}`:"本次设计范围内的指标口径与说明已记录。",pending?"去确认":"查看","resolve")}
  ${checkRow(!missing&&!methodIssues.length&&(s.scenes.length>0||s.metricOnly),"方法、指标角色与适用条件",methodIssues.length?methodIssues.map(esc).join(" "):missing?`${missing} 项必需指标角色尚未绑定。`:s.scenes.length?`${s.scenes.length} 个场景；${s.metrics.length?"引用当前指标定义":"采用定性研究与假设检验设计"}。`:"尚未创建场景，也可以明确只交付指标体系。","查看方法","stage",'data-stage="scenes"')}
  ${checkRow(s.confirmed,"当前设计的业务复核",s.confirmed?"已复核设计；修改相关内容后，确认会失效。":"确认目的、方法与证据要求符合用途，不是确认假设已被证实。",s.confirmed?"已确认":"查看并确认","confirm-business")}</div>
  ${!s.scenes.length&&s.metrics.length?`<label class="check-option"><input type="checkbox" id="metric-only" ${s.metricOnly?"checked":""}>本次先交付指标体系，分析场景以后补充</label>`:""}<div class="scope-note evidence-boundary"><strong>设计通过，不提升任何业务结论</strong><p>当前证据均为“待获取”，所有假设仍为“待验证”。${b.contexts.includes("战略选择")?"战略设计不能从短期下滑直接判定方向失败。":b.contexts.includes("独立数据专题")?"相关差异不能自动升级为活动的因果效果。":"方案建议不等于资源批准、行动执行或改善已发生。"}</p></div><div class="delivery-box"><h3>${ready?"固定一个可供后续分析使用的设计版本":"补齐设计缺口后，即可生成版本"}</h3><p>下载包含设计范围、方法与证据要求的演示快照。真实运行能力、生产交换格式和采用状态需由工程与消费方分别核对。</p><div class="actions">${btn(s.delivered?"生成下一演示版本":"生成演示设计版本","deliver","primary",ready?"":"disabled aria-describedby=\"delivery-reason\"")}${btn("保存工作草稿","save-draft")}</div>${ready?"":'<p class="fine" id="delivery-reason" style="margin-top:10px">先处理上方设计缺口、必要绑定与口径，再完成业务复核。</p>'}</div>`;
}

function checkRow(ok,title,detail,label,action,attrs=""){return `<div class="check-row"><span class="check-icon ${ok?"":"warn"}" aria-label="${ok?"已检查":"待处理"}">${ok?"✓":"!"}</span><div><strong>${title}</strong><p>${detail}</p></div>${btn(label,action,"small quiet",attrs)}</div>`;}

function libraryItems(){const arr=state.libraryType==="metric"?state.templates:state.methodTemplates;return arr.filter(t=>(state.filter!=="mine"||t.source==="我的模板")&&(!state.search||(t.name+t.description+(t.contexts||[]).join("")+(t.family||"")).includes(state.search)));}
function templateCard(t){const meta=t.type==="metric"?`${t.customMetrics?.length||t.metricIds.length} 个指标${t.scenes?.length?` · 含 ${t.scenes.length} 个场景`:""}`:t.roles.length?`${t.roles.length} 类指标角色 · 复用时重新匹配`:"定性证据与假设比较 · 指标按需补充";
  return `<article class="template-card"><div class="template-icon" aria-hidden="true">${t.type==="metric"?"▤":"≋"}</div><h2>${esc(t.name)}</h2><p>${esc(t.description)}</p>${t.type==="method"?`<div class="method-contexts">${(t.contexts||["经营改善","战略选择"]).map(c=>tag(esc(c),"neutral")).join("")}</div><p class="fine">${esc(t.family||"描述分析")} · 方法可服务多个语境</p>`:""}<div class="template-meta"><span>${meta}</span>${t.incomplete?tag("草稿模板","warn"):""}</div><div class="actions"><span class="template-origin">${esc(t.source)}</span>${btn("预览与使用 →","preview-template","small quiet",`data-id="${t.id}" data-type="${t.type}"`)}</div></article>`;}
function renderLibrary(){const list=libraryItems();return `<section class="page"><div class="page-heading"><div><h1>模板库</h1><p>把有效的指标与分析方法积累下来，下一次从这里开始。</p></div>${btn("＋ 导入模板","import")}</div>
  <nav class="library-tabs" aria-label="模板类别"><button class="tab ${state.libraryType==="metric"?"active":""}" data-action="library-tab" data-type="metric" aria-current="${state.libraryType==="metric"?"page":"false"}">指标体系</button><button class="tab ${state.libraryType==="method"?"active":""}" data-action="library-tab" data-type="method" aria-current="${state.libraryType==="method"?"page":"false"}">分析方法</button></nav>
  <div class="library-toolbar"><label class="search"><span aria-hidden="true">⌕</span><span class="sr-only">搜索模板</span><input id="template-search" type="search" placeholder="${state.libraryType==="metric"?"搜索指标体系或业务场景":"搜索分析问题或方法"}" value="${esc(state.search)}"></label><div class="filter-chips" aria-label="模板来源"><button class="${state.filter==="all"?"active":""}" aria-pressed="${state.filter==="all"}" data-action="library-filter" data-filter="all">全部模板</button><button class="${state.filter==="mine"?"active":""}" aria-pressed="${state.filter==="mine"}" data-action="library-filter" data-filter="mine">我的模板</button></div><span class="fine" id="template-total">${list.length} 个模板</span></div>
  <div class="template-grid" id="template-grid">${renderTemplateGrid(list)}</div><p class="library-foot">${state.libraryType==="metric"?"基于模板创建自己的副本，原模板保持不变。你也可以把完成的体系存回“我的模板”。":"方法模板保留分析步骤与指标角色。用于新体系时，会重新匹配指标，不复制原体系的指标定义。"}<br>原型中的内置内容为合成示例；生产方案继续保留现有行业模板。</p></section>`;}
function renderTemplateGrid(list){return list.length?list.map(templateCard).join(""):`<div class="empty-library"><h2>${state.filter==="mine"?"还没有自己的模板":"没有匹配的模板"}</h2><p>${state.filter==="mine"?"导入已有资料，或把完成的体系与分析方法保存到这里。":"换一个关键词试试。"}</p>${btn("导入模板","import","primary")}</div>`;}

function markDesignChanged(s){s.confirmed=false;s.revision++;}
function showUnderstanding(){const b=current().blueprint;showModal("修正我对需求的理解","不改变你已维护的指标；经营与战略语境可同时保留。",`
  <div class="field"><label for="analysis-purpose">这份设计要帮助什么</label><textarea id="analysis-purpose" required>${esc(b.purpose)}</textarea></div>
  <div class="field"><label for="analysis-decision">当前要研究的问题或选择</label><textarea id="analysis-decision" required>${esc(b.decision)}</textarea></div>
  <fieldset class="plain-fieldset"><legend>相关任务语境（可多选）</legend>${["经营改善","战略选择","独立数据专题"].map(c=>`<label><input type="checkbox" data-context="${c}" ${b.contexts.includes(c)?"checked":""}>${c}</label>`).join("")}</fieldset>
  <div class="field"><label for="analysis-boundary">需要保留的边界</label><textarea id="analysis-boundary">${esc(b.boundary)}</textarea></div>
  <div class="field"><label for="analysis-output">预期形成什么设计交付</label><textarea id="analysis-output">${esc(b.deliverable)}</textarea></div>`,btn("取消","close-modal")+btn("更新分析框架","save-understanding","primary"));}

function showHypothesis(index){const h=current().blueprint.hypotheses[index];showModal("完善假设的检验条件","支持和反对证据都要考虑。保存设计不会证实这个假设。",`
  <div class="field"><label for="hypothesis-text">待验证判断</label><textarea id="hypothesis-text" required>${esc(h.text)}</textarea></div>
  <div class="field"><label for="hypothesis-support">寻找什么支持证据</label><textarea id="hypothesis-support">${esc(h.support)}</textarea></div>
  <div class="field"><label for="hypothesis-counter">寻找什么反对证据或替代解释</label><textarea id="hypothesis-counter">${esc(h.counter)}</textarea></div>
  <div class="field"><label for="hypothesis-change">什么条件下改变判断</label><textarea id="hypothesis-change">${esc(h.change)}</textarea></div><p class="note">草稿可暂留缺口，设计检查会指出尚未补齐的条件。</p>`,btn("取消","close-modal")+btn("保存检验条件","save-hypothesis","primary",`data-index="${index}"`));}

function showEvidence(index){const e=current().blueprint.evidence[index];showModal("编辑证据要求",`${esc(e.name)} · 当前状态：待获取`,`
  <div class="field"><label for="evidence-source">准备从哪里获得依据</label><textarea id="evidence-source">${esc(e.source)}</textarea></div>
  <div class="field"><label for="evidence-check">怎样核对它是否可靠、适用</label><textarea id="evidence-check">${esc(e.check)}</textarea></div>
  <div class="field"><label for="evidence-failure">证据不足、冲突或核验失败时怎样处理</label><textarea id="evidence-failure">${esc(e.failure)}</textarea></div><p class="note">这里保存的是证据计划，不上传资料，不标记为已核验。缺口可保留在草稿中。</p>`,btn("取消","close-modal")+btn("保存证据要求","save-evidence","primary",`data-index="${index}"`));}

function showClaimBoundaries(){showModal("区分事实、解释、假设与建议","管理语境、证据强弱和判断性质是不同维度。",`<dl class="detail-grid"><dt>事实</dt><dd>观察到且具有可复核来源的内容；当前原型没有真实业务事实核验。</dd><dt>解释</dt><dd>对事实的解释，需说明依据、替代解释及适用限制。</dd><dt>假设</dt><dd>仍待检验的判断，保留支持、反对证据与修正条件。</dd><dt>建议</dt><dd>在明确条件下提出的方案，不等于已决策、已执行或有效。</dd></dl><div class="detail-rule warn">计算分解正确不自动证明因果；进入经营会议或获得高层认可也不会提升证据强度。</div>`,btn("理解了","close-modal","primary"));}

function showVerifyClaim(index){const b=current().blueprint,h=b.hypotheses[index];showModal("暂不能确认这个判断",esc(h.text),`<p>当前只定义了怎样检验，尚未取得并核验真实证据。</p><ul class="requirements">${b.evidence.map(e=>`<li>${esc(e.name)}：${esc(e.status)}</li>`).join("")}</ul><div class="detail-rule warn">仍保留“待验证假设”。保存设计、切换经营／战略语境或业务复核，都不能把它升级成事实或因果结论。</div>`,btn("返回完善证据计划","close-modal","primary"));}

function showOrganization(){const b=current().blueprint;showModal("调整调查怎样展开","同一任务可结合多种方式，不改变业务目的或证据强度。",`<fieldset class="plain-fieldset"><legend>计划采用的调查方式</legend>${["假设先行","深度研究","自主探索"].map(o=>`<label><input type="checkbox" data-organization="${o}" ${b.organizations.includes(o)?"checked":""}>${o}</label>`).join("")}</fieldset><p class="note">这里维护专业设计，不会启动 Agent、研究任务或模型调用。</p>`,btn("取消","close-modal")+btn("保存调查方式","save-organization","primary"));}

function metricCandidate(s){
  if(s.blueprint.preset==="strategy")return {name:"单店贡献利润",text:"补充单店贡献利润，明确收入和可避免成本，不直接把它当成扩店决策结论。",metrics:[{id:"store_revenue",name:"单店收入",group:"量化验证",description:"同一门店、期间与收入确认范围内的收入。",formula:"门店合格收入相加",unit:"元"},{id:"store_avoidable_cost",name:"单店可避免成本",group:"量化验证",description:"同一范围内，若该店停止经营便可以避免的成本，固定分摊项另行披露。",formula:"明确范围内可避免成本相加",unit:"元"},{id:"store_contribution",name:"单店贡献利润",group:"量化验证",description:"以明确口径的单店收入扣除可避免成本；不单独决定店型是否应扩张。",formula:"单店收入 − 单店可避免成本",unit:"元",dependencies:["store_revenue","store_avoidable_cost"]}]};
  if(s.blueprint.preset==="operating")return {name:"经营费用率",text:"增加经营费用率，观察同一范围下费用与收入的关系。",metrics:[{id:"expense_ratio",name:"经营费用率",group:"质量与约束",description:"同一范围、期间的经营费用占收入的比例，从组成项重算。",formula:"经营费用 ÷ 收入",unit:"%",dependencies:["operating_expenses","revenue"]}]};
  if(s.blueprint.preset==="data")return {name:"活动前支付订单数",text:"增加活动前30天的支付订单数，用于检查客户原本活跃度的差异。",metrics:[{id:"pre_activity_orders",name:"活动前支付订单数",group:"研究控制",description:"以活动起点为基准，向前30天内成功支付的订单按订单号去重。",formula:"活动前30天合格订单去重计数",unit:"单",note:"30天是此合成设计的明确建议，业务复核后方可交付；不等于已取得数据。"}]};
  return {name:"退款金额占比",text:"增加退款金额占成交总额的比例，和订单退款率分开看。",metrics:[{id:"refund_amount_share",name:"退款金额占比",group:"经营风险",description:"同一期间、范围内，退款金额占成交总额的比例，区分金额影响与订单队列比例。",formula:"退款额 ÷ 成交总额",unit:"%",dependencies:["refund_amount","gmv"]}]};
}

function toast(text){const el=$("#toast");el.textContent=text;el.hidden=false;clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>{el.hidden=true;},4200);}
function showModal(title,sub,body,foot="",extra=""){
  const modal=$("#modal");modalReturn=document.activeElement;
  $("#modal-content").innerHTML=`<div class="modal-head"><div><h2 id="modal-title">${title}</h2>${sub?`<p class="fine">${sub}</p>`:""}</div><button class="icon-button" data-action="close-modal" aria-label="关闭对话框">×</button></div><div class="modal-body">${body}<p class="inline-error" id="modal-error" role="alert" hidden></p></div>${foot?`<div class="modal-foot">${foot}</div>`:""}${extra}`;
  if(!modal.open)modal.showModal();
}
function closeModal(){const modal=$("#modal");if(modal.open)modal.close();if(modalReturn?.isConnected)modalReturn.focus({preventScroll:true});else $("#main").focus({preventScroll:true});}
function modalError(text){const el=$("#modal-error");if(el){el.textContent=text;el.hidden=false;document.querySelectorAll('#modal [required]').forEach(input=>{if(!input.value.trim()){input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby','modal-error');}});const group=$('#modal fieldset');if(group)group.setAttribute('aria-describedby','modal-error');}}
function closeMenu(){$("#sidebar").classList.remove("open");$(".mobile-backdrop")?.remove();}

function showMetric(id){const s=current(),m=metricById(id);if(!m)return;
  const referenced=s.scenes.filter(sc=>sc.bindings.some(b=>b.metric===m.id));
  showModal(esc(m.name),"指标解释 · 当前体系只维护这一份定义",`
  <dl class="detail-grid"><dt>业务分组</dt><dd>${esc(m.group)}</dd><dt>衡量什么</dt><dd>${esc(m.description)||"统计说明待补充"}</dd><dt>怎么算</dt><dd>${esc(m.formula)}</dd><dt>单位</dt><dd>${esc(m.unit)}</dd><dt>观察范围</dt><dd>按当前问题约定对象、期间与比较粒度；比率按同范围分子分母重算，真实数据资格另需核验。</dd></dl>
  ${m.note?`<div class="detail-rule">${esc(m.note)}</div>`:""}
  ${m.pending&&s.pending[m.pending]===null?`<div class="detail-rule warn">${m.pending==="refund"?"退款归属期间尚未确认，暂按建议形成草稿。":"复购观察窗口尚未确认，不能把建议当作已定口径。"} ${btn("去确认","resolve","small quiet")}</div>`:""}
  <div class="field"><label for="metric-name">指标名称</label><input id="metric-name" value="${esc(m.name)}"></div>
  <div class="field"><label for="metric-description">用业务语言解释这个指标</label><textarea id="metric-description">${esc(m.description)}</textarea><p class="fine">可以直接改名称和说明。修改计算关系时，可交给 AI 先提出建议。</p></div>
  <p class="fine">${referenced.length?`被 ${referenced.length} 个场景引用：${referenced.map(sc=>esc(sc.name)).join("、")}`:"还没有场景引用这个指标。"}</p>
  <details><summary>来源与专业详情</summary><p>来源：${esc(s.source)}。本原型是合成设计，不代表真实业务确认或运行验证。指标角色保存在场景绑定中，不在这里复制第二份口径。</p></details>`,
  btn("移除指标","delete-metric","small quiet",`data-id="${m.id}"`)+btn("取消","close-modal")+btn("保存修改","save-metric","primary",`data-id="${m.id}"`));
}

function showResolve(){const s=current();if(!s)return;const hasRefund="refund" in s.pending,hasRepeat="repeat" in s.pending;
  showModal("确认关键业务口径","这些判断会影响结果，集中确认一次即可。",`
  ${hasRefund?`<div class="resolve-item"><h3>退款金额归属哪个期间？</h3><p>按支付期间看订单最终净额；按退款完成期间看当期发生的退款影响。它不改变支付队列退款率。</p><label class="sr-only" for="refund-choice">退款金额归属</label><select id="refund-choice"><option value="payment" ${s.pending.refund==="payment"?"selected":""}>按订单支付期间归属</option><option value="completion" ${s.pending.refund==="completion"?"selected":""}>按退款完成期间归属</option></select></div>`:""}
  ${hasRepeat?`<div class="resolve-item"><h3>复购观察多长时间？</h3><p>建议用 90 天作为讨论起点，并保持复购客户与支付客户来自同一队列。</p><label class="sr-only" for="repeat-choice">复购观察窗口</label><select id="repeat-choice"><option value="90" ${s.pending.repeat==="90"?"selected":""}>90 天观察窗口</option><option value="30" ${s.pending.repeat==="30"?"selected":""}>30 天观察窗口</option><option value="180" ${s.pending.repeat==="180"?"selected":""}>180 天观察窗口</option></select></div>`:""}
  ${s.metrics.filter(m=>!m.description.trim()).map(m=>`<div class="resolve-item"><h3>${esc(m.name)}：统计说明待补充</h3><p>请用自己的话说明它衡量什么、统计范围是什么。不确定时可以先保留草稿。</p><label class="sr-only" for="missing-${m.id}">${esc(m.name)}的统计说明</label><textarea id="missing-${m.id}" data-missing-description="${m.id}" style="width:100%;min-height:90px;border:1px solid var(--line);border-radius:7px;padding:10px"></textarea></div>`).join("")}
  ${!hasRefund&&!hasRepeat&&!s.metrics.some(m=>!m.description.trim())?'<p>此体系没有演示口径待确认项。</p>':""}
  <p class="note">这是有业务含义的集中确认。正式系统应允许用自然语言补充其他口径，而非限制为上述选项。</p>`,btn("稍后再说","close-modal")+btn("确认这些口径","save-resolve","primary"));
}

function showBindings(){const s=current(),sc=s?.scenes[s.sceneIndex||0];if(!sc)return;
  showModal("场景与指标绑定",`${esc(sc.name)} · 引用当前体系，不复制定义`,sc.bindings.map((b,i)=>`<div class="binding-edit-row"><label for="binding-${i}">${esc(b.role)}</label><select id="binding-${i}" data-binding-index="${i}"><option value="">尚未绑定</option>${s.metrics.map(m=>`<option value="${m.id}" ${m.id===b.metric?"selected":""}>${esc(m.name)}</option>`).join("")}</select></div>`).join("")+`<p class="note">相同名称也可能口径不同，先看解释再绑定。缺少必需指标时可以先保留场景草稿。</p>${btn("＋ 缺少指标，新增并绑定","add-metric","small quiet",'data-bind="true"')}`,btn("取消","close-modal")+btn("保存绑定","save-bindings","primary"));
}

function addMetricModal(bind=false){const c=metricCandidate(current());showModal("用一句话添加指标",bind?"新指标先进入当前体系，再关联到分析场景。":"说清你想衡量的业务含义即可。",`
  <div class="field"><label for="new-metric-need">你希望增加什么指标？</label><textarea id="new-metric-need" required>${esc(c.text)}</textarea></div>
  <div class="detail-rule"><strong>演示候选：${esc(c.name)}</strong><ul>${c.metrics.map(m=>`<li>${esc(m.name)}：${esc(m.formula)}</li>`).join("")}</ul></div><p class="fine">此原型只演示上面这项预设候选；修改文字不会调用模型。依赖项一起检查，不以补充指标代替业务判断。</p>`,btn("取消","close-modal")+btn(bind?"加入体系并绑定":"加入指标体系","create-metric","primary",`data-bind="${bind}"`));}

function createScene(method=null,need=""){
  const s=current();if(!s)return;method=method||methods.find(m=>m.id===s.blueprint.methodId)||methods[0];
  const descriptions=["先明确对象、范围和比较依据，不把建议当事实。","结合业务机制，查找支持和反对证据。","检查输入条件、适用范围与可能的替代解释。","说明结论边界、未决问题及继续验证的条件。"];
  const bindings=method.roles.map((role,i)=>({role,required:method.roleRequirements?.[i]!==false,metric:s.metrics.some(m=>m.id===method.metricIds[i])?method.metricIds[i]:""}));
  s.scenes.push({id:`scene-${Date.now()}`,name:method.id==="net-change"?"每周净销售复盘":method.name,methodId:method.id,methodName:method.name,purpose:need||method.purpose,family:method.family||"描述分解",contexts:method.contexts||["经营改善","战略选择"],limit:method.limit||"描述性拆解不自动提供因果解释；真实执行支持需另行核对。",evidence:method.evidence||"同范围的原始记录、明确口径与独立核验条件。",steps:method.steps.map((title,i)=>({title:typeof title==="string"?title:title.title,detail:descriptions[i]||descriptions[3]})),bindings});s.sceneIndex=s.scenes.length-1;s.confirmed=false;s.revision++;
}

function getTemplate(id,type){return (type==="method"?state.methodTemplates:state.templates).find(t=>t.id===id);}
function previewTemplate(id,type){const t=getTemplate(id,type);if(!t)return;
  const metrics=t.customMetrics||baseMetrics.filter(m=>t.metricIds?.includes(m.id));
  showModal(esc(t.name),`${esc(t.source)} · ${type==="metric"?"指标体系模板":"分析方法模板"}`,`
  <p>${esc(t.description)}</p>${type==="metric"?`<h3>包含的指标</h3><div class="item-list">${metrics.map(m=>`<span>${esc(m.name)}</span>`).join("")}</div><p class="note">创建自己的副本后可自由修改，不影响这个模板。${t.incomplete?"此模板存在缺失说明，使用后仍需补齐才能交付。":"关键业务口径会在新体系中重新确认。"}</p>`:`<dl class="detail-grid"><dt>适合回答</dt><dd>${esc(t.purpose)}</dd><dt>适用语境</dt><dd>${(t.contexts||["经营改善","战略选择"]).map(esc).join("、")}</dd><dt>专业方法</dt><dd>${esc(t.family||"描述分解")}</dd><dt>分析步骤</dt><dd>${t.steps.map(x=>esc(typeof x==="string"?x:x.title)).join(" → ")}</dd><dt>指标角色</dt><dd>${t.roles.length?t.roles.map(esc).join("、"):"先使用定性证据，量化指标按需补充"}</dd><dt>证据要求</dt><dd>${esc(t.evidence||"同范围的记录与核验依据")}</dd><dt>适用限制</dt><dd>${esc(t.limit||"设计引用成立不代表执行能力已接通。")}</dd></dl>${current()?`<div class="detail-rule">当前体系：${esc(current().title)}<br>${t.contexts?.length&&!current().blueprint.contexts.some(c=>t.contexts.includes(c))?"当前用途不在适用语境中，不能直接使用此方法。":!t.roles.length?"可先使用定性研究与假设比较，不强制绑定指标。":t.metricIds.filter(id=>!current().metrics.some(m=>m.id===id)).length?"部分指标角色未找到精确匹配，添加后需要补充绑定。":"所需指标已找到匹配建议，使用后可逐项查看和调整。"}</div>`:'<div class="detail-rule warn">先创建或打开一套分析体系，再把方法用于其中。</div>'}`}`,
  btn("返回","close-modal")+(type==="metric"?btn("基于模板创建体系","use-template","primary",`data-id="${t.id}" data-type="metric"`):btn("用于当前分析体系","use-template","primary",`data-id="${t.id}" data-type="method" ${current()?"":"disabled"}`)));
}

function saveTemplateModal(type){const s=current();if(!s)return;const sc=s.scenes[s.sceneIndex||0];
  if(type==="method"&&!sc)return;
  const name=type==="metric"?s.title:sc.name;
  showModal(type==="metric"?"把这套体系保存为模板":"保存为可复用分析方法",type==="metric"?"保留专业定义，方便下次创建自己的副本。":"保留方法步骤与指标角色，下次重新匹配指标。",`
  <div class="field"><label for="template-name">模板名称</label><input id="template-name" value="${esc(name)}"></div><div class="field"><label for="template-purpose">适用业务或问题</label><textarea id="template-purpose">${esc(type==="metric"?s.goal:sc.purpose)}</textarea></div>
  ${type==="metric"&&s.scenes.length?`<label class="check-option"><input type="checkbox" id="include-scenes" checked>包含已设计的分析场景与方法引用</label>`:""}
  <p class="note">${type==="metric"?"不包含原始业务数据、某次文件绑定或分析数值。":"指标绑定将转换为角色要求，不创建第二份指标定义。"} 保存到“我的模板”，不会覆盖同名模板。</p>`,btn("取消","close-modal")+btn("保存到我的模板","commit-template","primary",`data-type="${type}"`));
}

function showImport(){state.importRows=null;state.importFile="";state.importError="";
  showModal("导入自己的指标模板","先识别和预览，再保存到模板库。",`
  <div class="dropzone"><strong>选择已有指标资料</strong><p>可以使用从 Excel 导出的 CSV 指标表，先预览，再确认。</p><label class="sr-only" for="import-file">选择本地模板文件</label><input id="import-file" type="file" accept=".csv,.json"><p class="fine" style="margin-top:12px">文件仅在当前浏览器预览，不会上传。<br>Excel 直接导入见完整方案，本原型展示表格识别流程。</p></div>
  <div class="or-line">暂时没有文件？</div><div class="actions" style="justify-content:center">${btn("使用一份演示指标表","demo-import")}</div>
  <div id="import-preview"></div>`,btn("取消","close-modal")+btn("确认导入模板","commit-import","primary","disabled id=\"commit-import\""));
}

function parseCsv(text){
  const rows=[];let row=[],cell="",quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===","&&!quoted){row.push(cell);cell="";}else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&text[i+1]==="\n")i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell="";}else cell+=c;}
  if(quoted)throw new Error("文件中有未闭合的引号，请检查 CSV 格式。");
  if(cell||row.length){row.push(cell);if(row.some(v=>v.trim()))rows.push(row);}
  return rows;
}
function importObjects(text,filename){let entries;
  if(filename.toLowerCase().endsWith(".json")){const parsed=JSON.parse(text);entries=Array.isArray(parsed)?parsed:parsed.metrics;if(!Array.isArray(entries))throw new Error("没有找到可识别的指标列表。请使用指标数组，或包含 metrics 的 JSON 文件。");}
  else {const rows=parseCsv(text.replace(/^\uFEFF/,""));if(rows.length<2)throw new Error("文件中没有可预览的指标行。");const headers=rows.shift().map(v=>v.trim());entries=rows.map(values=>Object.fromEntries(headers.map((h,i)=>[h,values[i]||""])));}
  const normalized=entries.map((m,i)=>({id:`imported-${i}`,imported:true,name:String(m["指标名称"]||m["名称"]||m.display_name||m.name||"").trim(),description:String(m["业务口径"]||m["统计说明"]||m["口径"]||m.definition||m.description||"").trim(),group:String(m["分组"]||m.group||"导入指标").trim(),formula:String(m["计算关系"]||m.formula||"计算关系待检查").trim(),unit:String(m["单位"]||m.unit||"待确认").trim()}));
  if(!normalized.length||normalized.some(m=>!m.name))throw new Error("有指标缺少名称。请保留“指标名称”或 name 列后重试。");
  const names=new Set();for(const m of normalized){if(names.has(m.name))throw new Error(`“${m.name}”出现重复，请区分或合并后重新导入；当前输入已保留。`);names.add(m.name);}
  return normalized;
}
function renderImportPreview(){const rows=state.importRows;if(!rows)return;const missing=rows.filter(m=>!m.description).length;
  $("#import-preview").innerHTML=`<section class="import-preview"><p class="import-filename">${esc(state.importFile)}</p><h3>已识别 ${rows.length} 个指标</h3><div class="status-notice ${missing?"":"good"}"><div><strong>${missing?`${missing} 项缺少业务口径，先保存为草稿模板`:"名称与业务口径已识别，可保存为模板草稿"}</strong><p>这里只做导入预览，不代表计算与业务正确性已通过。</p></div></div><div class="table-scroll" role="region" aria-label="导入指标预览" tabindex="0"><table><thead><tr><th>指标名称</th><th>识别到的业务口径</th></tr></thead><tbody>${rows.map(m=>`<tr><td>${esc(m.name)}</td><td>${esc(m.description)||tag("待补充口径","warn")}</td></tr>`).join("")}</tbody></table></div><div class="field" style="margin-top:18px"><label for="import-name">保存到模板库的名称</label><input id="import-name" value="${esc(state.importFile.replace(/\.[^.]+$/,""))}"></div></section>`;
  $("#commit-import").disabled=false;
}

function showAbout(){showModal("自然语言驱动的分析体系工作台","产品方案 v0.2 · 沿用 JuanerAI 已接受的暖白／灰绿 UI",`
  <p>把自然语言需求变成分析设计。经营与战略是管理语境，数据分析是共享专业能力；也允许独立数据专题。</p>
  <div class="about-flow"><div><strong>01</strong><span>描述要研究的问题或要做的选择，无需先选类别或模板。</span></div><div><strong>02</strong><span>在体系总览维护问题、假设、反证与改变判断的条件。</span></div><div><strong>03</strong><span>指标体系和场景方法联动；定性战略设计可以暂时没有指标。</span></div><div><strong>04</strong><span>固定设计版本，保留实际证据待获取状态，按需沉淀两类模板。</span></div></div>
  <a class="proposal-link" href="方案.html" target="_blank" rel="noopener">阅读完整产品方案与验收范围 ↗</a>
  <p class="note">所有内容为合成示例，状态只在内存保留，刷新后重置。不会调用模型、改原仓、发布真实 SAP 或向 JuanerAI 写入数据。runtime 继续由原工程任务迭代。</p>`,btn("开始体验","close-modal","primary"));}

function requestRefine(text){
  const s=current();if(!s)return;
  if(!text.trim()){toast("先说说希望怎样修改。");return;}
  s.chat.push({role:"user",text});
  if(state.stage==="review"&&/[？?吗]|确认/.test(text)){
    s.chat.push({role:"assistant",text:pendingCount(s)||blueprintIssues(s).length?"左侧会指出口径、假设或证据计划缺口。设计复核只确认设计可用，不证明任何业务结论。":"设计通过表示目的、方法、引用和证据要求已写清。当前证据仍待获取，假设未证实，也没有实际决策或执行。"});render();return;
  }
  let p;
  if(/战略视角|增长方向/.test(text)){
    if(s.blueprint.contexts.includes("战略选择")){s.chat.push({role:"assistant",text:"当前已保留战略选择语境，可继续完善关键假设、候选道路与证据要求。"});render();return;}
    p={kind:"context",value:"战略选择",title:"补充战略视角",description:"保留现有经营问题与指标，增加对增长道路、客户价值和长期投入的检查。",before:"当前主要围绕经营改善组织问题",after:"增加战略问题、候选道路与关键假设，不新建第二份指标定义",impact:"原经营设计保留，相关业务复核失效；不会批准资源或启动分析。"};
  }else if(/经营落点/.test(text)){
    if(s.blueprint.contexts.includes("经营改善")){s.chat.push({role:"assistant",text:"当前已包含经营语境。目标、约束和复盘要求可在同一设计中维护。"});render();return;}
    p={kind:"context",value:"经营改善",title:"补充经营落点",description:"把战略假设连接到经营目标、能力约束和可观察的试点反馈。",before:"当前主要比较发展道路",after:"增加目标约束与试点反馈问题，原战略假设保持待验证",impact:"不自动填预算、负责人或真实结果，不改变现有指标口径。"};
  }else if(/客户访谈/.test(text)){
    p={kind:"evidence",title:"补充客户访谈证据计划",description:"在定量记录之外，保留客户动机、替代选择与反例。",before:"当前按既有资料设计证据要求",after:"增加访谈来源、样本适用性检查和不足处置，状态仍为待获取",impact:"不上传资料、不联系客户，也不把访谈计划变成事实证据。"};
  }else if(/推翻|反证|改变判断/.test(text)){
    p={kind:"counter",title:"加强假设的反证条件",description:"保留其他解释，并说明哪些证据会要求修正当前假设。",before:s.blueprint.hypotheses[0].counter,after:"如果同口径比较、合格对照或跨周期证据不支持该机制，应保留替代解释并重新设计验证。",impact:"只完善检验条件，假设仍未证实。"};
  }else if(/因果判断|适用条件/.test(text)){
    s.chat.push({role:"assistant",text:s.blueprint.preset==="data"?"需检查分配机制、活动前差异和对照可比性；仅有领券后的复购差异不能支持因果判断。":s.scenes[s.sceneIndex||0]?.limit||"先明确方法的输入、证据要求和适用范围，不能用模板名称代替适用性判断。"});render();return;
  }else if(/查看问题.*指标/.test(text)){state.stage="overview";render(false);return;
  }else if(/金额占比|退款风险指标|新增指标/.test(text)){
    if(!["gmv","refund_amount"].every(id=>s.metrics.some(m=>m.id===id))){s.chat.push({role:"assistant",text:"当前没有退款金额占比的基础定义。请在指标视图使用‘添加指标’，查看适合当前语境的演示候选。"});render();return;}
    if(s.metrics.some(m=>m.id==="refund_amount_share")){s.chat.push({role:"assistant",text:"体系中已包含“退款金额占比”，可以点击指标查看解释。"});render();return;}
    p={kind:"add",title:"增加退款金额占比",description:"用金额口径补充订单退款率，两者分别保留。",before:"当前只有按订单数计算的退款率",after:"新增：退款金额占比 = 退款额 ÷ 成交总额",impact:"引用现有两项指标，不新增第二份成交或退款定义。"};
  }else if(/退款/.test(text)&&/完成|支付|归属/.test(text)){
    const completion=/完成/.test(text);p={kind:"refund",value:completion?"completion":"payment",title:"调整退款金额归属",description:"修改退款额及净销售的期间解释，订单退款率保持原来的支付队列。",before:s.pending.refund==="completion"?"退款按完成期间归属":s.pending.refund==="payment"?"退款按支付期间归属":"退款期间尚未确认（草稿建议按支付期间）",after:completion?"退款按完成期间归属":"退款按支付期间归属",impact:`影响退款额、净销售额及 ${s.scenes.filter(sc=>sc.bindings.some(b=>["net_sales","refund_amount"].includes(b.metric))).length} 个相关场景；业务复核将重新待确认。`};
  }else if(/只保留|精简|太复杂/.test(text)){
    if(s.blueprint.preset!=="metrics"){s.chat.push({role:"assistant",text:"此演示的精简建议适用于电商指标体系。当前可直接完善问题和方法，或按需补充指标；不会套入不适用的退款指标。"});render();return;}
    p={kind:"simplify",title:"精简为销售与退款体系",description:"保留计算与护栏所需闭包，移出客户复购模块。",before:`${s.metrics.length} 个指标，包含客户质量模块`,after:"保留成交、净额、订单、退款额、退款订单与订单退款率",impact:"同时移出仅讨论客户复购的问题；相关场景如存在缺口会要求重新绑定，不能悬空交付。"};
  }else if(/证据不足/.test(text)||state.stage==="scenes"&&s.scenes.length){
    p={kind:"scene",title:/证据|不足|处理/.test(text)?"补充证据不足的处理":"补充场景中的比较要求",description:"把你的说明加到当前分析场景，不改指标定义。",before:"当前场景使用基础比较与证据要求",after:/证据|不足|处理/.test(text)?"资料缺失、零分母或核验不通过时，保留可用部分并明确未完成判断。":"补充按品类、渠道逐组比较，先核对各组适用条件，再形成描述性差异。",impact:"影响当前场景的证据与核验要求；指标口径保持原定义。"};
  }else{
    s.chat.push({role:"assistant",text:"这份原型用预设建议演示流程。可以使用上方建议补充问题、反证或客户访谈计划，也可直接编辑理解、指标与场景。正式产品由 LLM 翻译你的自然语言需求。"});render();return;
  }
  s.proposal=p;render();
}

function addAmountShare(bind=false){const s=current();if(!s)return;
  if(!s.metrics.some(m=>m.id==="refund_amount_share"))s.metrics.push({id:"refund_amount_share",name:"退款金额占比",group:"经营风险",description:"同一期间内，退款金额占成交总额的比例，用来观察退款的金额影响。",formula:"退款额 ÷ 成交总额",unit:"%",note:"不等于支付队列订单退款率；完成归属下应披露历史订单退款的影响。"});
  if(bind&&s.scenes.length){const sc=s.scenes[s.sceneIndex||0];if(!sc.bindings.some(b=>b.metric==="refund_amount_share"))sc.bindings.push({role:"金额风险补充",metric:"refund_amount_share"});}
  s.confirmed=false;s.revision++;
}
function applyProposal(){const s=current(),p=s?.proposal;if(!p)return;
  if(p.kind==="context"){
    const extra=makeAnalysisBlueprint(p.value==="战略选择"?"strategy":"operating");
    s.blueprint.contexts.push(p.value);
    s.blueprint.questions.push(...copy(extra.questions).map(q=>({...q,metricRefs:q.metricRefs.filter(ref=>s.metrics.some(m=>m.id===ref))})));
    s.blueprint.hypotheses.push(...copy(extra.hypotheses).map((h,i)=>({...h,id:`context-${s.revision}-${i}`})));
    s.blueprint.evidence.push(...copy(extra.evidence).map((e,i)=>({...e,id:`context-e-${s.revision}-${i}`})));
    if(p.value==="战略选择")s.blueprint.options=copy(extra.options);
    s.blueprint.boundary+=" 新增视角仅用于问题与证据设计，不自动改变方向或批准行动。";
  }else if(p.kind==="evidence"){
    s.blueprint.evidence.push({id:`interview-${s.revision}`,name:"客户动机与替代选择访谈",kind:"客户访谈",source:"目标客群的访谈记录与反例",check:"说明样本边界、来源与反对意见，不把少量意见推为总体事实。",failure:"代表性不足或存在冲突时，保留待验证判断。",status:"待获取"});
  }else if(p.kind==="counter"){s.blueprint.hypotheses[0].counter=p.after;
  }else if(p.kind==="refund"){
    s.pending.refund=p.value;
    for(const m of s.metrics.filter(x=>["refund_amount","net_sales"].includes(x.id)))m.note=`退款金额按${p.value==="completion"?"退款完成期间":"订单支付期间"}归属；退款率仍按同一支付队列计算。`;
  }else if(p.kind==="add"){addAmountShare(false);}
  else if(p.kind==="simplify"){
    const ids=["gmv","net_sales","order_count","refund_amount","refunded_orders","refund_rate"];
    s.metrics=s.metrics.filter(m=>ids.includes(m.id));delete s.pending.repeat;
    s.blueprint.questions=s.blueprint.questions.filter(q=>q.metricRefs.every(id=>ids.includes(id)));
    for(const sc of s.scenes)for(const b of sc.bindings)if(!ids.includes(b.metric))b.metric="";
  }else if(p.kind==="scene"){if(s.scenes.length)s.scenes[s.sceneIndex||0].extraEvidence=p.after;s.blueprint.evidence[0].failure=p.after;}
  s.chat.push({role:"assistant",text:`已采纳：${p.title}。修改已进入同一工作草稿；相关业务复核已标为待确认。`});
  s.confirmed=false;s.revision++;s.proposal=null;render();toast("修改建议已采纳到工作草稿。");
}

async function handleAction(action,el){
  const s=current();
  switch(action){
    case "home":setRoute("home");break;
    case "systems":setRoute("systems");break;
    case "library":setRoute("library");break;
    case "open-system":openSystem(el.dataset.id);break;
    case "stage":state.stage=el.dataset.stage;closeModal();render(false);window.scrollTo({top:0,behavior:"instant"});break;
    case "metric-view":state.metricView=el.dataset.view;render();break;
    case "menu":{
      const sidebar=$("#sidebar");sidebar.classList.toggle("open");if(sidebar.classList.contains("open")){const back=document.createElement("button");back.className="mobile-backdrop show";back.setAttribute("aria-label","关闭导航");back.dataset.action="close-menu";document.body.append(back);}else closeMenu();break;
    }
    case "close-menu":closeMenu();break;
    case "about":showAbout();break;
    case "close-modal":closeModal();break;
    case "example":{
      const n=Number(el.dataset.index);
      state.homeDraft=analysisExamples[n].text;
      $("#need").value=state.homeDraft;$("#need").focus();break;
    }
    case "generate":{
      const text=$("#need").value.trim();state.homeDraft=text;
      if(!text){const err=$("#home-error");err.textContent="先写一点业务需求，几个字也可以。";err.hidden=false;$("#need").focus();break;}
      setRoute("generating");state.busy=true;
      generateTimer=setTimeout(()=>{if(!state.busy)return;const opts={need:text};if(inferAnalysisPreset(text)==="metrics"&&/精简|只看/.test(text))opts.metrics=baseMetrics.filter(m=>["gmv","net_sales","order_count","refund_amount","refunded_orders","refund_rate"].includes(m.id));createSystem(opts);state.busy=false;setRoute("work","overview");},750);break;
    }
    case "stop-generation":clearTimeout(generateTimer);state.busy=false;setRoute("home");toast("演示生成已停止，原需求仍保留。");break;
    case "save-draft":toast("工作草稿已保留在当前演示中，刷新后会重置。");break;
    case "rename":showModal("修改体系名称","名称帮助你找到这套体系。",`<div class="field"><label for="system-name">体系名称</label><input id="system-name" value="${esc(s.title)}"></div>`,btn("取消","close-modal")+btn("保存名称","save-name","primary"));break;
    case "save-name":{const title=$("#system-name").value.trim();if(!title){modalError("请填写体系名称。");break;}if(s.title!==title){s.title=title;markDesignChanged(s);}closeModal();render();break;}
    case "edit-understanding":showUnderstanding();break;
    case "save-understanding":{
      const purpose=$("#analysis-purpose").value.trim(),decision=$("#analysis-decision").value.trim(),contexts=[...document.querySelectorAll('[data-context]:checked')].map(x=>x.dataset.context);
      if(!purpose||!decision||!contexts.length){modalError("请说明目的、要支持的判断，并至少保留一个适用语境。");break;}
      Object.assign(s.blueprint,{purpose,decision,contexts,boundary:$("#analysis-boundary").value.trim(),deliverable:$("#analysis-output").value.trim()});s.goal=purpose;markDesignChanged(s);closeModal();render();break;
    }
    case "edit-hypothesis":showHypothesis(Number(el.dataset.index));break;
    case "save-hypothesis":{
      const h=s.blueprint.hypotheses[Number(el.dataset.index)],text=$("#hypothesis-text").value.trim();if(!text){modalError("请写下要检验的判断。");break;}
      Object.assign(h,{text,support:$("#hypothesis-support").value.trim(),counter:$("#hypothesis-counter").value.trim(),change:$("#hypothesis-change").value.trim(),kind:"待验证假设",verified:false});markDesignChanged(s);closeModal();render();break;
    }
    case "edit-evidence":showEvidence(Number(el.dataset.index));break;
    case "save-evidence":{
      Object.assign(s.blueprint.evidence[Number(el.dataset.index)],{source:$("#evidence-source").value.trim(),check:$("#evidence-check").value.trim(),failure:$("#evidence-failure").value.trim(),status:"待获取"});markDesignChanged(s);closeModal();render();break;
    }
    case "claim-boundaries":showClaimBoundaries();break;
    case "verify-claim":showVerifyClaim(Number(el.dataset.index));break;
    case "edit-organization":showOrganization();break;
    case "save-organization":{
      const organizations=[...document.querySelectorAll('[data-organization]:checked')].map(x=>x.dataset.organization);if(!organizations.length){modalError("请至少保留一种调查方式。");break;}s.blueprint.organizations=organizations;markDesignChanged(s);closeModal();render();break;
    }
    case "metric":showMetric(el.dataset.id);break;
    case "save-metric":{
      const m=metricById(el.dataset.id),name=$("#metric-name").value.trim(),description=$("#metric-description").value.trim();
      if(!name||!description){modalError("名称和业务解释需要填写完整；你的输入已保留。");break;}
      if(s.metrics.some(x=>x.id!==m.id&&x.name===name)){modalError("已有同名指标，请先区分业务含义。");break;}
      if(m.name!==name||m.description!==description){m.name=name;m.description=description;s.confirmed=false;s.revision++;if(m.pending)s.pending[m.pending]=null;}
      closeModal();render();toast("指标已修改，相关业务复核需要重新确认。");break;
    }
    case "delete-metric":{
      const m=metricById(el.dataset.id);const dependencies={gmv:["net_sales","aov","refund_amount_share"],refund_amount:["net_sales","refund_amount_share"],order_count:["aov","refund_rate"],refunded_orders:["refund_rate"],customers:["repeat_rate"],repeat_customers:["repeat_rate"]};
      const deps=s.metrics.filter(x=>(dependencies[m.id]||[]).includes(x.id)||x.dependencies?.includes(m.id)),scenes=s.scenes.filter(sc=>sc.bindings.some(b=>b.metric===m.id)),questions=s.blueprint.questions.filter(q=>q.metricRefs.includes(m.id));
      if(deps.length||scenes.length||questions.length){showModal("这个指标仍被使用",`${esc(m.name)} · 需要先处理引用`, `<p>直接移除会使下面的计算、问题或场景失去依据。当前指标没有删除。</p><div class="item-list">${deps.map(x=>`<span>指标：${esc(x.name)}</span>`).join("")}${scenes.map(x=>`<span>场景：${esc(x.name)}</span>`).join("")}${questions.map(x=>`<span>问题：${esc(x.title)}</span>`).join("")}</div>`,btn("保留并返回","close-modal","primary"));break;}
      showModal("移除这个指标？",esc(m.name),"<p>它会从当前工作草稿移除。已交付旧版本仍然保留。</p>",btn("取消","close-modal")+btn("从草稿移除","commit-delete","primary",`data-id="${m.id}"`));break;
    }
    case "commit-delete":s.metrics=s.metrics.filter(m=>m.id!==el.dataset.id);s.confirmed=false;s.revision++;closeModal();render();toast("已从工作草稿移除。");break;
    case "resolve":showResolve();break;
    case "save-resolve":{
      if($("#refund-choice")){s.pending.refund=$("#refund-choice").value;for(const m of s.metrics.filter(x=>["net_sales","refund_amount"].includes(x.id)))m.note=`退款金额按${s.pending.refund==="completion"?"退款完成期间":"订单支付期间"}归属；订单退款率仍按同一支付队列重算。`;}
      if($("#repeat-choice")){s.pending.repeat=$("#repeat-choice").value;for(const m of s.metrics.filter(x=>["repeat_rate","repeat_customers"].includes(x.id)))m.note=`使用 ${s.pending.repeat} 天观察窗口，同一客户队列计算。`;}
      document.querySelectorAll('[data-missing-description]').forEach(input=>{const metric=s.metrics.find(m=>m.id===input.dataset.missingDescription);if(metric&&input.value.trim())metric.description=input.value.trim();});
      s.confirmed=false;s.revision++;closeModal();render();toast("关键口径已记录，业务复核仍需查看当前草稿。");break;
    }
    case "suggest":requestRefine(el.dataset.text);break;
    case "refine":requestRefine($("#refine").value);break;
    case "apply-proposal":applyProposal();break;
    case "discard-proposal":s.proposal=null;s.chat.push({role:"assistant",text:"已放弃这项修改建议，工作草稿没有变化。"});render();break;
    case "add-metric":addMetricModal(el.dataset.bind==="true");break;
    case "create-metric":{
      if(!$("#new-metric-need").value.trim()){modalError("先描述希望增加的指标。");break;}
      const candidate=metricCandidate(s),available=new Set([...s.metrics,...candidate.metrics].map(m=>m.id));if(candidate.metrics.some(m=>m.dependencies?.some(id=>!available.has(id)))){modalError("此候选缺少依赖指标，请先补齐定义。");break;}
      candidate.metrics.forEach(m=>{if(!s.metrics.some(x=>x.id===m.id))s.metrics.push(copy(m));});const id=candidate.metrics.at(-1).id;
      if(el.dataset.bind==="true"&&s.scenes.length){const sc=s.scenes[s.sceneIndex||0];if(!sc.bindings.some(b=>b.metric===id))sc.bindings.push({role:"量化补充",required:false,metric:id});}
      if(s.blueprint.preset==="strategy"&&!s.blueprint.questions.at(-1).metricRefs.includes(id))s.blueprint.questions.at(-1).metricRefs.push(id);
      markDesignChanged(s);closeModal();render();toast(el.dataset.bind==="true"?"指标已加入体系并关联到当前场景。":"指标已加入当前体系。");break;
    }
    case "generate-scene":{
      const need=($("#scene-new-need")||$("#scene-need"))?.value.trim();if(!need){toast("先描述这个场景要回答的问题。");break;}
      createScene(null,need);closeModal();state.stage="scenes";render();toast("分析场景草稿已生成，可以调整步骤与指标绑定。");break;
    }
    case "new-scene":showModal("新增分析场景","沿用当前分析体系，按问题组织方法与证据。",`<div class="field"><label for="scene-new-need">希望分析什么问题？</label><textarea id="scene-new-need">${esc(s.blueprint.decision)}</textarea></div>`,btn("取消","close-modal")+btn("生成场景草稿","generate-scene","primary"));break;
    case "select-scene":s.sceneIndex=Number(el.dataset.index);render();break;
    case "bindings":showBindings();break;
    case "save-bindings":{
      const sc=s.scenes[s.sceneIndex||0];document.querySelectorAll("[data-binding-index]").forEach(select=>sc.bindings[Number(select.dataset.bindingIndex)].metric=select.value);
      s.confirmed=false;s.revision++;closeModal();render();toast(sc.bindings.some(b=>!b.metric)?"场景草稿已保存，未绑定项会在检查时提示。":"场景绑定已保存，引用当前体系的指标。");break;
    }
    case "edit-scene":{
      const sc=s.scenes[s.sceneIndex||0];showModal("修改分析场景","用业务语言编辑，指标绑定保持独立可查。",`<div class="field"><label for="scene-name">场景名称</label><input id="scene-name" value="${esc(sc.name)}"></div><div class="field"><label for="scene-purpose">它要回答什么问题？</label><textarea id="scene-purpose">${esc(sc.purpose)}</textarea></div><div class="field"><label for="scene-steps">分析步骤（每行一个，用自己的话写）</label><textarea id="scene-steps" rows="5">${esc(sc.steps.map(x=>x.title).join("\n"))}</textarea></div>`,btn("取消","close-modal")+btn("保存场景","save-scene","primary"));break;
    }
    case "save-scene":{
      const sc=s.scenes[s.sceneIndex||0],name=$("#scene-name").value.trim(),purpose=$("#scene-purpose").value.trim(),steps=$("#scene-steps").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!name||!purpose||!steps.length){modalError("请填写场景名称、业务问题和至少一个分析步骤。");break;}
      sc.name=name;sc.purpose=purpose;sc.steps=steps.map((title,i)=>({title,detail:sc.steps[i]?.detail||"结合已有定义、适用条件和证据要求检查。"}));s.confirmed=false;s.revision++;closeModal();render();break;
    }
    case "library-tab":state.libraryType=el.dataset.type;state.search="";state.filter="all";render();break;
    case "library-filter":state.filter=el.dataset.filter;render();break;
    case "preview-template":previewTemplate(el.dataset.id,el.dataset.type);break;
    case "use-template":{
      const t=getTemplate(el.dataset.id,el.dataset.type);if(!t)break;
      if(t.type==="metric"){createSystem({title:`${t.name} · 我的副本`,goal:t.description,metrics:t.customMetrics||baseMetrics.filter(m=>t.metricIds.includes(m.id)),scenes:t.scenes||[],source:`来自模板：${t.name}`});}
      else{if(!s)break;if(t.contexts?.length&&!s.blueprint.contexts.some(c=>t.contexts.includes(c))){modalError("此方法的适用语境与当前体系不符。请先回体系总览核对用途，或选择其他方法；没有自动修改体系。");break;}createScene(t);}
      closeModal();setRoute("work",t.type==="metric"?"metrics":"scenes");toast(t.type==="metric"?"已创建自己的体系副本，原模板保持不变。":"方法已形成当前体系中的场景，请查看匹配与绑定。");break;
    }
    case "save-method-template":saveTemplateModal("method");break;
    case "save-metric-template":if(!s.delivered){toast("先完成设计检查并生成交付版本。");break;}saveTemplateModal("metric");break;
    case "commit-template":{
      const type=el.dataset.type,name=$("#template-name").value.trim(),description=$("#template-purpose").value.trim();if(!name||!description){modalError("请填写模板名称和适用问题。");break;}
      let unique=name;const arr=type==="metric"?state.templates:state.methodTemplates;let n=2;while(arr.some(t=>t.name===unique))unique=`${name}（副本 ${n++}）`;
      if(type==="metric"){
        const snap=s.delivered.snapshot;arr.unshift({id:`mine-${Date.now()}`,type:"metric",name:unique,description,source:"我的模板",customMetrics:copy(snap.metrics),metricIds:snap.metrics.map(m=>m.id),scenes:$("#include-scenes")?.checked?copy(snap.scenes):[],groups:new Set(snap.metrics.map(m=>m.group)).size});
      }else{
        const sc=s.scenes[s.sceneIndex||0];arr.unshift({id:`method-${Date.now()}`,type:"method",name:unique,description,source:"我的模板",purpose:sc.purpose,family:sc.family,contexts:copy(sc.contexts),evidence:s.blueprint.evidence.map(e=>`${e.name}；来源：${e.source}；核验：${e.check}；不足：${e.failure}`).join("\n"),limit:sc.limit,steps:sc.steps.map(x=>x.title),roles:sc.bindings.map(b=>b.role),roleRequirements:sc.bindings.map(b=>b.required!==false),metricIds:sc.bindings.map(b=>b.metric)});
      }
      closeModal();state.libraryType=type;state.filter="mine";state.search="";setRoute("library");toast("已加入我的模板，原有同名内容不会覆盖。");break;
    }
    case "import":showImport();break;
    case "demo-import":{
      state.importFile="我的经营指标.csv";state.importRows=importObjects("指标名称,业务口径,分组,计算关系,单位\n净销售额,成交商品金额减去已完成退款金额,经营结果,成交总额减退款额,元\n支付订单数,成功支付订单按订单号去重,经营结果,订单去重计数,单\n客户复购率,,客户质量,复购客户数除以支付客户数,%",state.importFile);renderImportPreview();break;
    }
    case "commit-import":{
      if(!state.importRows)break;const name=$("#import-name").value.trim();if(!name){modalError("请给模板起一个名称。");break;}
      let unique=name,n=2;while(state.templates.some(t=>t.name===unique))unique=`${name}（副本 ${n++}）`;
      state.templates.unshift({id:`import-${Date.now()}`,type:"metric",name:unique,description:"从自己的指标资料导入，保留原说明；使用前需要检查定义和计算关系。",source:"我的模板",customMetrics:copy(state.importRows),metricIds:state.importRows.map(m=>m.id),groups:new Set(state.importRows.map(m=>m.group)).size,incomplete:true});
      closeModal();state.libraryType="metric";state.filter="mine";state.search="";setRoute("library");toast("已导入为个人草稿模板，缺失口径没有被自动补造。");break;
    }
    case "confirm-business":{
      if(s.confirmed){toast("当前草稿已复核；相关修改后会重新提示确认。");break;}
      const b=s.blueprint;showModal("复核这套业务设计","确认设计符合用途，不等于证实假设。",`<dl class="detail-grid"><dt>分析目的</dt><dd>${esc(b.purpose)}</dd><dt>支持的判断</dt><dd>${esc(b.decision)}</dd><dt>适用语境</dt><dd>${b.contexts.map(esc).join("、")}</dd><dt>设计内容</dt><dd>${b.questions.length} 个问题 · ${b.hypotheses.length} 个假设 · ${s.metrics.length} 个指标 · ${s.scenes.length} 个场景</dd><dt>证据计划</dt><dd>${b.evidence.length} 项，实际证据仍待获取</dd></dl><p class="note">确认的是当前设计。缺失的必需内容和未确认口径仍阻断设计交付；不会批准经营行动或把假设变为事实。方法执行与真实采用尚未验证。</p>`,btn("回去修改","close-modal")+btn("确认当前业务设计","commit-confirm","primary"));break;
    }
    case "commit-confirm":s.confirmed=true;closeModal();render();toast("当前业务设计已复核。");break;
    case "deliver":{
      if(!designReady(s)){toast("还有待处理内容，请先完成设计检查。");break;}
      if(s.delivered&&s.delivered.revision===s.revision){toast("当前草稿与已交付版本相同，无需重复生成。");break;}
      s.deliveryCount=(s.deliveryCount||0)+1;s.delivered={version:`1.${s.deliveryCount-1}.0`,revision:s.revision,snapshot:copy({assetModel:"analysis-design-prototype",title:s.title,goal:s.goal,blueprint:s.blueprint,metrics:s.metrics,scenes:s.scenes,pending:s.pending})};s.deliveryHistory=s.deliveryHistory||[];s.deliveryHistory.push(copy(s.delivered));render();toast("演示设计版本已固定，实际证据仍待获取。");break;
    }
    case "download":{
      if(!s.delivered)break;const content={prototype:true,notice:"合成设计演示，不是生产 SAP；未执行真实模型调用或消费验证。",design_version:s.delivered.version,...s.delivered.snapshot};const blob=new Blob([JSON.stringify(content,null,2)],{type:"application/json;charset=utf-8"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`${s.title}-${s.delivered.version}.demo.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast("已触发演示设计包下载；未执行真实资产发布。");break;
    }
  }
}

document.addEventListener("click",event=>{const el=event.target.closest("[data-action]");if(el&&!el.disabled)handleAction(el.dataset.action,el).catch(error=>{console.error(error);toast("原型操作遇到问题，当前内容仍在页面中。");});});
document.addEventListener("input",event=>{
  if(event.target.id==="need")state.homeDraft=event.target.value;
  if(event.target.id==="template-search"){state.search=event.target.value;const items=libraryItems();$("#template-grid").innerHTML=renderTemplateGrid(items);$("#template-total").textContent=`${items.length} 个模板`;}
});
document.addEventListener("change",async event=>{
  if(event.target.id==="metric-only"){current().metricOnly=event.target.checked;markDesignChanged(current());render();}
  if(event.target.id==="import-file"){
    const file=event.target.files[0];if(!file)return;state.importRows=null;$("#commit-import").disabled=true;$("#import-preview").innerHTML="";$("#modal-error").hidden=true;
    if(file.size>1024*1024){modalError("原型仅预览 1MB 以内的合成 CSV／JSON，请换一份小文件。");return;}
    try{state.importFile=file.name;state.importRows=importObjects(await file.text(),file.name);renderImportPreview();}
    catch(error){modalError(`导入未完成：${error.message} 文件名与当前页面仍保留，可重新选择。`);}
  }
});
$("#modal").addEventListener("click",event=>{if(event.target===$("#modal")){const rect=event.target.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeModal();}});
$("#modal").addEventListener("cancel",event=>{event.preventDefault();closeModal();});
document.addEventListener("keydown",event=>{if(event.key==="Escape")closeMenu();if((event.ctrlKey||event.metaKey)&&event.key==="Enter"){if(document.activeElement?.id==="need"){$('[data-action="generate"]').click();event.preventDefault();}else if(document.activeElement?.id==="refine"){$('[data-action="refine"]').click();event.preventDefault();}}});
render();
