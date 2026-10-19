/* v0.2 synthetic authoring model. Describes analysis; never executes or verifies business claims. */
"use strict";
const analysisExamples = [
  {name:"把经营问题拆清楚",hint:"销售在增长，利润却下降，先设计怎样诊断和比较调整方案。",text:"我们是连锁零售企业，销售在增长，利润却下降。请帮我设计一套分析方案，找出应关注的问题，比较促销、商品结构与费用调整，并说明需要哪些证据。"},
  {name:"为重大选择建立依据",hint:"明年继续扩店，还是优先投入供应链与会员经营？",text:"明年还应该继续扩店吗？还是优先把资源投入供应链和会员经营？请先设计比较不同道路的分析框架，列出关键假设、需要的研究和重新考虑选择的条件。"},
  {name:"独立研究一个数据问题",hint:"检验促销与复购的关系，先分清事实、解释和证据边界。",text:"我只想研究领券客户复购更高这件事，设计怎样区分客户原本更活跃和优惠券带来的增量。先做独立数据专题，暂不提出经营行动建议。"},
  {name:"建立可复用的指标体系",hint:"自然语言生成指标草稿，再补充用途、场景与分析方法。",text:"我们是服饰电商品牌，希望建立一套经营指标体系。重点看净销售额、退款和客户复购，按渠道与品类做每周复盘，知道增长有没有质量。"}
];
const profitMetrics = [
  {id:"revenue",name:"收入",group:"经营结果",description:"在声明期间与业务范围内，按已确认收入规则计入的金额。",formula:"合格收入金额相加",unit:"元"},
  {id:"cost",name:"营业成本",group:"经营结果",description:"与本期已确认收入匹配的商品成本，避免混入库存采购总额。",formula:"匹配收入的商品成本相加",unit:"元"},
  {id:"gross_profit",name:"毛利额",group:"经营结果",description:"收入扣除匹配的营业成本。",formula:"收入 − 营业成本",unit:"元",dependencies:["revenue","cost"]},
  {id:"gross_margin",name:"毛利率",group:"质量与约束",description:"同一期间与范围内，毛利额占收入的比例。",formula:"毛利额 ÷ 收入",unit:"%",dependencies:["gross_profit","revenue"]},
  {id:"operating_expenses",name:"经营费用",group:"质量与约束",description:"本分析边界内的人力、租金、履约与营销等费用，不含已计入营业成本的金额。",formula:"范围内经营费用相加",unit:"元"},
  {id:"operating_profit",name:"经营利润",group:"经营结果",description:"本合成方案将经营利润简化为毛利额扣除经营费用；不冒充财务报表的完整利润口径。",formula:"毛利额 − 经营费用",unit:"元",dependencies:["gross_profit","operating_expenses"],note:"仅适用于当前明确的简化分析范围，真实科目范围需要业务确认。"}
];
const analysisMethodTemplates = [
  {id:"profit-review",type:"method",name:"利润变化与改善方案分析",description:"先核对利润变动，再把发现连接到经营目标、约束和可比较的调整方案。",source:"内置示例",contexts:["经营改善"],family:"描述分解 · 方案比较",roles:["经营结果","毛利组成","费用约束"],purpose:"销售增长为何未带来利润改善，当前周期应如何调整？",steps:["核对收入、成本与费用口径","拆解毛利与费用变化","比较调整方案的收益和代价","设计试点、护栏与复盘条件"],metricIds:["operating_profit","gross_profit","operating_expenses"],evidence:"预算、收入成本与费用明细；方案影响和业务约束。",limit:"变动分解不能证明促销的因果效果，方案尚待授权与试验。"},
  {id:"strategic-options",type:"method",name:"战略选项与情景比较",description:"围绕客户价值、竞争方式与能力约束，比较值得持续投入的不同道路。",source:"内置示例",contexts:["战略选择","经营改善"],family:"情景分析 · 假设检验",roles:[],purpose:"继续扩店、建设供应链或投入会员经营，哪些选择在什么条件下成立？",steps:["明确候选道路与取舍边界","比较客户、竞争和能力依据","检验关键假设与反对证据","说明资源取舍与重审条件"],metricIds:[],evidence:"客户访谈、行业竞争研究、能力盘点与历史经营事实。",limit:"短期经营下滑不直接证明战略失败；可先完成定性设计，量化指标按需补充。"},
  {id:"effect-boundary",type:"method",name:"关联与增量效果判断",description:"检验客户原有活跃差异与活动增量，明确数据能支持哪种程度的判断。",source:"内置示例",contexts:["独立数据专题","经营改善","战略选择"],family:"效果评估 · 假设检验",roles:["复购表现","客户队列","复购客户"],purpose:"领券客户复购更高，是选择差异还是优惠带来的增量？",steps:["明确比较对象、窗口与指标","检查活动前差异与选择偏差","设计可行的对照或实验","区分事实、解释和因果限制"],metricIds:["repeat_rate","customers","repeat_customers"],evidence:"客户队列与活动前行为、领券记录、分配机制或合格对照设计。",limit:"仅有领券后的复购差异不能作为因果结论。"}
];

function inferAnalysisPreset(need) {
  if(/扩店|战略|竞争方式|发展方向|进入.*市场|业务组合|不同道路|长期.*投入/.test(need))return "strategy";
  if(/数据专题|领券|因果|选择偏差|独立研究|暂不.*建议/.test(need))return "data";
  if(/指标体系|建立.*指标|精简.*指标|模板/.test(need))return "metrics";
  return "operating";
}

function makeAnalysisBlueprint(preset) {
  const b={preset,intent:preset==="metrics"?"建设可复用体系":"设计具体分析方案",contexts:[preset==="strategy"?"战略选择":preset==="data"?"独立数据专题":"经营改善"],organizations:preset==="strategy"?["假设先行","深度研究"]:preset==="data"?["假设先行","自主探索"]:["假设先行"],questions:[],hypotheses:[],evidence:[],options:[],judgmentRule:"事实、解释、假设和建议分别表达；证据不足时保留未完成判断。",methodId:preset==="strategy"?"strategic-options":preset==="data"?"effect-boundary":preset==="operating"?"profit-review":"net-change"};
  if(preset==="strategy"){
    Object.assign(b,{title:"零售增长路径分析体系",purpose:"比较继续扩店、供应链建设与会员经营的长期投入依据，而非仅追求某个规模目标。",decision:"未来资源优先投入哪条增长道路，以及应减少或放弃哪些投入？",boundary:"先设计比较与验证，不批准资源，不从一个季度的利润变化判定战略失败。",deliverable:"战略选项、选择依据、关键假设、主要风险与重新审视条件。"});
    b.questions=[{title:"哪类客户值得持续服务？",detail:"识别核心需求、替代选择与持续支付理由。",metricRefs:[]},{title:"我们靠什么创造不同价值？",detail:"比较竞争方式、成本结构、商品和服务能力。",metricRefs:[]},{title:"哪条道路有可成立的投入逻辑？",detail:"比较资源承诺、机会成本、能力缺口与退出条件。",metricRefs:[]}];
    b.hypotheses=[{id:"h1",text:"现有店型在目标客群中仍有可持续的价值与扩张空间。",support:"成熟店型在多个周期的客户价值与经营质量证据。",counter:"新店边际表现恶化、需求替代或竞争优势无法复制。",change:"跨周期证据持续反对关键前提时，缩小扩店试点并重新比较道路。",kind:"待验证假设",verified:false},{id:"h2",text:"供应链或会员能力建设可能比新增门店带来更可持续的价值。",support:"能力瓶颈与客户需求证据，以及可检验的改善机制。",counter:"能力建设成本过高、客户价值不足或难以形成差异。",change:"试点不能改善关键能力或客户价值时，调整投入安排。",kind:"待验证假设",verified:false}];
    b.evidence=[{id:"e1",name:"客户需求与替代选择",kind:"客户访谈",source:"目标客群访谈与购买路径研究",check:"保留样本边界、原始依据与反例，不把少数访谈当总体事实。",failure:"样本单一或反证缺失时，只形成待验证判断。",status:"待获取"},{id:"e2",name:"行业与竞争方式",kind:"行业研究",source:"行业资料、竞争活动与公开信息",check:"核对时间、来源与可比范围，区分公开事实和推测。",failure:"关键来源冲突时保留不同解释。",status:"待获取"},{id:"e3",name:"店型与内部能力条件",kind:"内部数据与业务判断",source:"不同成熟度门店的跨周期表现及能力盘点",check:"区分店龄、区域和投入阶段，复核经营口径。",failure:"没有可比经营周期时，不判定扩店路径成败。",status:"待获取"}];
    b.options=[{name:"选择性继续扩店",tradeoff:"投入新店、占用资本；需证明既有店型的价值能够复制。"},{name:"优先建设供应链",tradeoff:"短期能力投入；需验证成本、履约或商品能力的改善机制。"},{name:"优先投入会员经营",tradeoff:"减少其他投入；需验证目标客户的持续价值与服务能力。"}];
  }else if(preset==="data"){
    Object.assign(b,{title:"优惠券与复购关系研究",purpose:"设计如何区分观察到的复购差异、客户选择差异与可能的活动增量。",decision:"当前资料能支持什么判断，还需要怎样的对照或实验？",boundary:"这是独立数据专题；暂不要求经营目标、资源批准或行动建议。",deliverable:"指标口径、研究设计、可能的解释、证据要求和推断限制。"});
    b.questions=[{title:"比较的是同一类客户吗？",detail:"检查活动前活跃度、渠道与客户生命周期的差异。",metricRefs:["customers"]},{title:"观察窗口与复购定义一致吗？",detail:"同一队列、时间边界与订单资格，防止分母变化。",metricRefs:["repeat_rate","repeat_customers"]},{title:"如何区分选择差异与活动增量？",detail:"说明分配机制、对照设计和未观测混杂的限制。",metricRefs:[]}];
    b.hypotheses=[{id:"h1",text:"领券客户原本更活跃，可能解释部分复购差异。",support:"活动前客户行为存在稳定差异。",counter:"可比对照或随机分配后仍有可复核的增量证据。",change:"对照设计改变后重估解释，不用简单相关替代效果。",kind:"待验证假设",verified:false},{id:"h2",text:"优惠券可能增加了原本不会发生的购买。",support:"合格实验或识别设计下的增量证据。",counter:"不存在可比对照，或增量在合理敏感性检查中消失。",change:"识别假设不成立时，降为描述性比较并披露限制。",kind:"待验证假设",verified:false}];
    b.evidence=[{id:"e1",name:"同一客户队列与观察窗口",kind:"内部数据",source:"支付订单、客户身份与领券记录",check:"客户去重、订单资格、窗口和分母一致。",failure:"身份或窗口不一致时阻止效果比较。",status:"待获取"},{id:"e2",name:"活动前差异与分配机制",kind:"实验或观察设计",source:"活动前行为、资格与分配记录",check:"审查选择偏差、对照可比性和必要识别假设。",failure:"只有活动后差异时，不形成因果结论。",status:"待获取"}];
  }else{
    const metricBuild=preset==="metrics";
    Object.assign(b,{title:metricBuild?"服饰电商经营分析体系":"销售增长与利润改善分析体系",purpose:metricBuild?"每周复盘销售与客户质量，及时发现退款风险，支持渠道与品类经营决策。":"把销售增长、毛利变化和费用放回经营目标与约束中，比较当前周期的改善方案。",decision:metricBuild?"怎样衡量增长质量，哪些变化需要进一步调查？":"当前经营周期应调整什么，收益、代价与风险是什么？",boundary:"在既定业务方向下设计诊断与调整；资源批准和行动执行由获授权负责人承担。",deliverable:metricBuild?"可维护的指标体系、分析场景与复核要求。":"差距诊断、候选方案、资源约束、试点及复盘安排。"});
    b.questions=metricBuild?[{title:"增长来自哪里，保留了多少？",detail:"区分成交规模、退款与净销售，按渠道和品类比较。",metricRefs:["gmv","net_sales","refund_amount"]},{title:"客户是否持续购买？",detail:"保持客户队列与观察窗口一致。",metricRefs:["customers","repeat_rate"]},{title:"增长付出了什么代价？",detail:"检查退款护栏与其他业务约束，避免只优化局部指标。",metricRefs:["refund_rate"]}]:[{title:"利润差距由哪些部分组成？",detail:"先复核口径，按毛利与经营费用分解。",metricRefs:["operating_profit","gross_profit","operating_expenses"]},{title:"这些变化是否符合原计划？",detail:"关联预算、客户投入、库存与现金约束。",metricRefs:["revenue","gross_margin"]},{title:"不同调整方案的收益与代价是什么？",detail:"设计方案比较、负责人、观察窗口、护栏和停止条件。",metricRefs:[]}];
    b.hypotheses=[{id:"h1",text:metricBuild?"退款和客户质量变化可能使规模增长未转化为经营质量改善。":"折扣、商品结构或费用增加可能使收入增长未转化为利润改善。",support:"口径一致的组成项与业务过程证据。",counter:"一次性投入、季节性或预算安排能够解释变化。",change:"组成项核验或反证不支持时，保留其他解释并调整调查。",kind:"待验证假设",verified:false}];
    b.evidence=[{id:"e1",name:metricBuild?"订单、退款与客户队列":"收入、成本与费用明细",kind:"内部数据",source:metricBuild?"合格支付、完成退款及客户身份记录":"同一业务范围与期间的收入、成本及费用记录",check:"复核范围、期间、币种、去重和计算关系；只证明相应数值事实。",failure:"缺失、冲突或不可核对时，不输出仿成功结论。",status:"待获取"},{id:"e2",name:"目标、计划与业务约束",kind:"计划与业务判断",source:"阶段目标、预算、约束和业务负责人说明",check:"区分事前计划、事后解释与待验证假设。",failure:"没有目标或约束时，先披露比较范围，不自动替用户批准方案。",status:"待获取"},{id:"e3",name:"调整方案与后续验证",kind:"试点设计",source:"候选方案、负责人、资源边界和观察安排",check:"写清预期、护栏、观察周期及继续／调整／停止条件。",failure:"分析建议不等于已决策或已执行，缺效果证据不声称改善成立。",status:"待获取"}];
  }
  return b;
}

function prototypeMetricIssues(s){
  if(s.metrics.some(m=>m.imported))return ["导入资料只完成识别预览，正式结构与计算校验尚未执行。"];
  const known=new Set(s.metrics.map(m=>m.id));const deps={net_sales:["gmv","refund_amount"],aov:["gmv","order_count"],repeat_rate:["repeat_customers","customers"],refund_rate:["refunded_orders","order_count"],refund_amount_share:["refund_amount","gmv"]};
  const issues=[];
  for(const m of s.metrics){if(!m.name.trim()||!m.description.trim())issues.push(`${m.name||"未命名指标"}缺少业务定义。`);for(const d of m.dependencies||deps[m.id]||[])if(!known.has(d))issues.push(`${m.name}缺少依赖指标。`);}
  return issues;
}
function blueprintIssues(s){
  const b=s.blueprint,issues=[];
  if(!b.purpose.trim()||!b.decision.trim()||!b.contexts.length)issues.push("业务目的或决策问题尚未明确。");
  if(!b.boundary.trim()||!b.deliverable.trim()||!b.organizations.length)issues.push("范围、预期交付或调查方式尚未明确。");
  if(!b.questions.length||b.questions.some(q=>!q.title.trim()))issues.push("问题结构不完整。");
  if(b.questions.some(q=>q.metricRefs.some(id=>!s.metrics.some(m=>m.id===id))))issues.push("问题引用的指标已缺失。");
  if(b.hypotheses.some(h=>!h.support.trim()||!h.counter.trim()||!h.change.trim()))issues.push("关键假设缺少支持、反对证据或改变判断的条件。");
  if(!b.evidence.length||b.evidence.some(e=>!e.source.trim()||!e.check.trim()||!e.failure.trim()))issues.push("证据计划缺少来源、核验办法或不足处置。");
  if(b.hypotheses.some(h=>h.kind!=="待验证假设"&&!h.verified))issues.push("没有核验依据的假设不能升级为已确认判断。");
  return issues;
}
function missingRequiredBindings(s){return s.scenes.flatMap(sc=>sc.bindings.filter(b=>b.required!==false&&(!b.metric||!s.metrics.some(m=>m.id===b.metric))));}
function sceneDesignIssues(s){return s.scenes.flatMap(sc=>!sc.purpose.trim()||!sc.steps.length?[`${sc.name}缺少问题或分析步骤。`]:sc.contexts?.length&&!sc.contexts.some(c=>s.blueprint.contexts.includes(c))?[`${sc.name}与当前用途不适配，请核对方法。`]:[]);}
function designReady(s){return blueprintIssues(s).length===0&&prototypeMetricIssues(s).length===0&&sceneDesignIssues(s).length===0&&pendingCount(s)===0&&missingRequiredBindings(s).length===0&&s.confirmed&&(s.scenes.length>0||s.metricOnly);}
