# L1 回填逐族证据审计（batch2）

> 生成：controller 语义审计（配额期接管）。每赋值族 → definition 族关键词证据句；无证据即 FLAG。

## ecommerce-marketplace.yaml

- gmv → refund_adjustment：默认剔除退款订单、不含运费与虚拟赠品
- gmv → scope_inclusion：默认剔除退款订单、不含运费与虚拟赠品
- order_count → refund_adjustment：默认不含退款订单，一笔订单多次支付只计最终成功一笔
- uv → scope_inclusion：默认剔除内部渠道与机器流量
- aov → refund_adjustment：分子默认剔除退款
- FLAG signup_count → validity_threshold（无族关键词证据）
- commission_revenue → refund_adjustment：分子口径与 GMV 一致（默认剔除退款）
- repeat_buyer_count → validity_threshold：统计周期内下单 ≥2 次的去重用户数（复购率分子）
- marketing_spend → scope_inclusion：统计周期内外部渠道投放费用合计（不含平台内部资源位）
- buy_repeat_rate → validity_threshold：统计周期内下单 ≥2 次的用户数 / 下单用户数
- retention_30d → validity_threshold：新用户首访后 30 日内再次活跃的用户占比
- refund_rate → refund_adjustment：统计周期内退款订单数 / 支付订单数
- return_rate → refund_adjustment：统计周期内退货订单数 / 支付订单数（退货 = 已发货后退回商品，区别于未发货仅
- negative_review_rate → validity_threshold：统计周期内 1–2 星评价数 / 有效评价数
- fulfillment_ok_rate → measurement_anchor：按承诺发货时间准时发货的订单数 / 应发货订单数
- FLAG deliver_avg_days → measurement_anchor（无族关键词证据）
- FLAG new_user_gmv_share → scope_inclusion（无族关键词证据）
- FLAG new_seller_gmv_share → scope_inclusion（无族关键词证据）
- FLAG mobile_gmv_share → scope_inclusion（无族关键词证据）
- cross_category_buy_rate → validity_threshold：统计周期内购买 ≥2 个品类商品的用户数 / 购买用户数
- FLAG take_rate → refund_adjustment（无族关键词证据）
- FLAG arpu → refund_adjustment（无族关键词证据）
- marketing_roi → attribution_window：归因到投放渠道的 GMV / 投放费用（归因窗口默认 7 日点击）
- FLAG marketing_gmv_share → scope_inclusion（无族关键词证据）
- subsidy_rate → fee_composition：补贴金额（券 + 价格补贴）/ GMV
- activation_rate → validity_threshold：新注册用户在注册后 7 日内完成关键行为（默认：首单浏览 ≥3 个商品详情）的占
- FLAG silent_user_share → validity_threshold（无族关键词证据）
- silent_user_share → measurement_anchor：近 90 日无任何访问的存量用户 / 期末存量用户
- session_avg_duration → validity_threshold：单次有效访问的平均时长（秒），剔除 <5 秒的误触访问
## saas-subscription.yaml

- mrr → scope_inclusion：默认不含试用，年费按月分摊
- mrr → proration_rule：统计周期末所有有效付费订阅按月折算的经常性收入合计
- FLAG arr → proration_rule（无族关键词证据）
- paid_seats_count → scope_inclusion：统计周期末所有有效订阅的付费席位合计
- mau → validity_threshold：自然月内至少一次有效登录的去重用户数（有效登录 = 会话 ≥60 秒）
- FLAG signup_count → scope_inclusion（无族关键词证据）
- trial_count → scope_inclusion：统计周期内开始试用（含免费试用与 POC）的客户数
- mrr_churn_rate → scope_inclusion：统计周期内流失 MRR / 期初 MRR（不含收缩，收缩单独计 contract
- FLAG first_response_time_minutes → measurement_anchor（无族关键词证据）
- FLAG resolution_time_hours → measurement_anchor（无族关键词证据）
- resolution_time_hours → scope_inclusion：工单从创建到解决的平均小时数（中位数口径，不含待客户回复时间）
- uptime_rate → scope_inclusion：统计周期内服务可用时间 / 总时间（按 SLA 口径剔除计划内维护）
- FLAG incident_count → scope_inclusion（无族关键词证据）
- activation_rate → validity_threshold：新付费客户在签约后 30 日内完成关键行为（默认：核心功能被 ≥3 名成员使用）
- FLAG self_serve_share → scope_inclusion（无族关键词证据）
- multi_product_share → validity_threshold：购买 ≥2 条产品线的客户数 / 付费客户数
- FLAG annual_contract_share → scope_inclusion（无族关键词证据）
- avg_customer_lifetime_months → proration_rule：1 / 月度客户流失率（按 12 个月移动平均流失率折算），单位月
- FLAG ltv → fee_composition（无族关键词证据）
- trial_activation_rate → validity_threshold：试用客户在试用期内完成关键行为（默认：邀请 ≥1 名成员 + 使用核心功能 3 
- license_utilization_rate → validity_threshold：近 30 日活跃席位 / 付费席位合计，衡量超卖风险与续约健康度
## content-community.yaml

- dau → validity_threshold：当日至少一次有效访问（会话 ≥5 秒）的去重用户数
- FLAG new_user_count → scope_inclusion（无族关键词证据）
- total_play_count → validity_threshold：统计周期内内容（视频/图文）有效播放次数，有效 = 播放 ≥3 秒
- ad_impression_count → validity_threshold：统计周期内广告有效曝光次数（可见 ≥1 秒）
- ad_revenue → fee_composition：统计周期内广告收入（按媒体侧口径确认，不含代理商返点）
- content_completion_rate → validity_threshold：播放进度 ≥80% 的播放次数 / 有效播放次数（视频类核心质量）
- FLAG creator_retention_90d → scope_inclusion（无族关键词证据）
- FLAG new_creator_content_share → scope_inclusion（无族关键词证据）
- click_to_finish_rate → validity_threshold：点击进入后完成播放（≥80%）的占比，内容承接力
## digital-marketing.yaml

- ad_spend → fee_composition：统计周期内广告实际消耗金额（含媒体 + 代理服务费
- impression_count → validity_threshold：统计周期内广告有效曝光次数（可见 ≥1 秒）
- click_count → validity_threshold：统计周期内广告有效点击次数（剔除误触：点击后停留 <2 秒）
- FLAG lead_count → validity_threshold（无族关键词证据）
- conversion_count → attribution_window：归因到广告曝光/点击的转化事件数（下单/支付/激活），默认 7 日点击归因
- converted_revenue → attribution_window：归因到广告的转化订单金额合计（归因口径与转化量一致）
- FLAG bounce_rate → validity_threshold（无族关键词证据）
- creative_fatigue_rate → validity_threshold：同一素材对同一用户曝光 ≥3 次的曝光占比，创意衰退预警
- FLAG new_vs_retargeting_share → scope_inclusion（无族关键词证据）
- viewability_rate → validity_threshold：满足可视标准（≥50% 区域 ≥1 秒）的曝光占比
- FLAG landing_page_conversion_rate → scope_inclusion（无族关键词证据）
- FLAG attribution_lag_days → measurement_anchor（无族关键词证据）
## supply-chain-logistics.yaml

- order_fulfillment_count → scope_inclusion：不含取消单）
- inventory_value → scope_inclusion：期末在库库存的账面金额（标准成本口径，在途不计）
- FLAG inventory_value → fee_composition（无族关键词证据）
- inventory_value → measurement_anchor：期末在库库存的账面金额（标准成本口径，在途不计）
- otif → measurement_anchor：按承诺时间足量签收的订单数 / 应交付订单数，SCOR 履约质量总闸
- on_time_shipment_rate → measurement_anchor：按承诺时效完成发出的发运单数 / 应发运单数
- supplier_otif_rate → measurement_anchor：供应商按约定日期足量到货的订单数 / 采购到货订单数
- FLAG forecast_accuracy_rate → cap_anomaly_rule（无族关键词证据）
- FLAG abc_sku_share → validity_threshold（无族关键词证据）
- FLAG slow_moving_inventory_share → validity_threshold（无族关键词证据）
- FLAG fulfillment_cost_per_order → fee_composition（无族关键词证据）
- order_cycle_time_hours → measurement_anchor：订单下达到签收的平均小时数（P50）
- dock_to_stock_hours → measurement_anchor：供应商到货到完成上架的可销售状态平均小时数
- FLAG order_to_ship_hours → measurement_anchor（无族关键词证据）
- ship_to_deliver_days → measurement_anchor：发运到客户签收的平均自然日（P50）
- FLAG exception_resolve_hours → measurement_anchor（无族关键词证据）
- FLAG rma_processing_days → measurement_anchor（无族关键词证据）
## cloud-cost.yaml

- total_cloud_cost → fee_composition：统计周期内云厂商账单费用合计（含折扣与承诺抵扣后净额
- cost_anomaly_count → cap_anomaly_rule：统计周期内检测到的成本异常事件数（环比突增 >30% 且超绝对阈值）
- FLAG cost_anomaly_resolve_hours → measurement_anchor（无族关键词证据）
- idle_resource_rate → validity_threshold：低利用率资源（CPU <5% 持续 7 天）的费用占比，优化机会清单
- commitment_expiry_risk_count → measurement_anchor：未来 90 天内到期的预留/节省计划承诺数量，续约风险预警
- FLAG optimization_cycle_days → measurement_anchor（无族关键词证据）

## REVIEW#2 裁决全记录（2026-10-09，独立评审员 PASS 后处置）

**规则澄清（本批次起为 SOP 修正案）：指标自身携带的 caliber_switches 开关键 = 该族直接证据**（试点先例：服饰 gmv 引 deduct_refund）。「继承→留空」仅适用于**无自身开关**的纯继承口径。

由此撤销 3 处清空（恢复工人原判）：take_rate→refund_adjustment（include_refund:false）、arpu→refund_adjustment（include_refund:false）、forecast_accuracy_rate→cap_anomaly_rule（mape_cap_100:true）。**净修正 9 处**：清空 2（ecom/saas nps 评分类）、族改位 5（retention_30d→validity、new_seller_gmv_share→scope、avg_customer_lifetime_months→proration_rule、incident_count→scope、creator_retention_90d/new_creator_content_share→scope）、uv 去 validity 单值。

评审发现处置：L1 修正分解标签已改（见 rationale 总统计）；L2 本表 FLAG 行保留原判标记（族证据以 rationale 摘句列为准，FLAG 义为「关键词表未命中」而非「无依据」）；L5 signup_count 族证据补充——「默认剔除注册后未激活的机器账号」（validity_threshold 依据句）；J1 gmv「不含运费」不改（与试点 gmv SOP 冻结一致，记入普查口径后续统一裁决）。

执行事故留档（重申）：首版修正脚本误伤块式 YAML，已回滚至干净基线重做；fix3 守卫 bug 未生效（零改动）；fix4 块感知重做并逐条断言。
