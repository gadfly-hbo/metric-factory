# 其余 6 模板 L1 回填依据留档（batch2）

> 依据摘句由脚本从各指标 definition 原文截取（口径关键词句优先，≤40 字），保证与原文逐字一致。生成：controller 接管生成（子代理配额耗尽，工人已完成 YAML 回填）。

## 电商交易平台（ecommerce-marketplace.yaml，53 指标）

| 指标名 | caliber_type | aggregation | 依据摘句（definition 原文） | 留空理由 |
|---|---|---|---|---|
| gmv | refund_adjustment + scope_inclusion | （空） | 默认剔除退款订单、不含运费与虚拟赠品 |  |
| order_count | refund_adjustment | （空） | 默认不含退款订单，一笔订单多次支付只计最终成功一笔 |  |
| uv | scope_inclusion + validity_threshold | （空） | 统计周期内去重访问用户数，按设备与账号联合去重 |  |
| cvr | （空） | ratio_policy | 下单用户数 / 访客数，衡量流量到订单的转化效率 | 无口径决策 |
| aov | refund_adjustment | ratio_policy | 分子默认剔除退款 |  |
| paid_user_count | （空） | （空） | 统计周期内至少完成一笔支付成功的去重用户数 | 未构成 8 族口径决策（直计/去重/继承类） |
| signup_count | validity_threshold | （空） | 统计周期内完成注册（含第三方授权注册）的去重新用户数 |  |
| app_dau | （空） | （空） | 当日启动 App 或访问站点的去重用户数（活跃 = 至少一次有效访问） | 未构成 8 族口径决策（直计/去重/继承类） |
| active_seller_count | （空） | （空） | 统计周期内至少产生一笔支付成功订单的去重商家数 | 未构成 8 族口径决策（直计/去重/继承类） |
| new_listing_count | （空） | （空） | 统计周期内首次上架并通过审核的商品数 | 无口径决策 |
| search_uv | （空） | （空） | 统计周期内使用站内搜索的去重用户数 | 未构成 8 族口径决策（直计/去重/继承类） |
| commission_revenue | refund_adjustment | （空） | 分子口径与 GMV 一致（默认剔除退款） |  |
| order_user_count | （空） | （空） | 统计周期内至少完成一笔支付成功的去重用户数（与 paid_user_count … | 未构成 8 族口径决策（直计/去重/继承类） |
| repeat_buyer_count | validity_threshold | （空） | 统计周期内下单 ≥2 次的去重用户数（复购率分子） |  |
| marketing_spend | scope_inclusion | （空） | 统计周期内外部渠道投放费用合计（不含平台内部资源位） |  |
| buy_repeat_rate | validity_threshold | ratio_policy | 统计周期内下单 ≥2 次的用户数 / 下单用户数 |  |
| retention_30d | scope_inclusion | ratio_policy | 新用户首访后 30 日内再次活跃的用户占比 |  |
| refund_rate | refund_adjustment | ratio_policy | 默认仅统计已完成退款，不含退款中 |  |
| return_rate | refund_adjustment | ratio_policy | 统计周期内退货订单数 / 支付订单数（退货 = 已发货后退回商品，区别于未发货仅… |  |
| order_cancel_rate | （空） | ratio_policy | 统计周期内用户主动取消 + 超时未支付关闭的订单数 / 下单订单数 | 无口径决策 |
| negative_review_rate | validity_threshold | ratio_policy | 统计周期内 1–2 星评价数 / 有效评价数 |  |
| review_rate | （空） | ratio_policy | 统计周期内已评价订单数 / 确认收货订单数 | 无口径决策 |
| avg_rating | （空） | （空） | 统计周期内有效评价的算术平均星级（1–5） | 未构成 8 族口径决策（直计/去重/继承类） |
| fulfillment_ok_rate | measurement_anchor | ratio_policy | 按承诺发货时间准时发货的订单数 / 应发货订单数 |  |
| deliver_avg_days | measurement_anchor | （空） | 支付成功到确认收货的平均自然日天数 |  |
| out_of_stock_rate | （空） | ratio_policy | 统计周期内因库存不足导致的不可售商品曝光次数 / 商品总曝光次数 | 无口径决策 |
| complaint_rate | （空） | ratio_policy | 统计周期内发起客诉的订单数 / 支付订单数 | 无口径决策 |
| nps | validity_threshold | （空） | 推荐者占比（9–10 分）− 贬损者占比（0–6 分），基于周期性调研问卷 |  |
| new_user_gmv_share | scope_inclusion | ratio_policy | 新客（统计周期内首次购买用户）贡献 GMV / 全站 GMV，衡量增长对拉新的依… |  |
| category_top3_gmv_share | （空） | ratio_policy | GMV 最高的三个品类合计占比，衡量品类结构分散度 | 无口径决策 |
| seller_top10_gmv_share | （空） | ratio_policy | GMV 前 10 名商家合计 GMV / 全站 GMV，衡量供给侧对头部商家的依… | 无口径决策 |
| new_seller_gmv_share | measurement_anchor | ratio_policy | 入驻 90 日内商家的 GMV / 全站 GMV，衡量供给侧新鲜度 |  |
| mobile_gmv_share | scope_inclusion | ratio_policy | 移动端（App + 移动 Web）GMV / 全站 GMV |  |
| paid_traffic_share | （空） | ratio_policy | 付费渠道（投放入口）带来的访问量 / 总访问量 | 未构成 8 族口径决策（直计/去重/继承类） |
| cross_category_buy_rate | validity_threshold | ratio_policy | 统计周期内购买 ≥2 个品类商品的用户数 / 购买用户数 |  |
| sell_through_rate | （空） | ratio_policy | 统计周期内产生销售的商品数（SKU）/ 在架商品数 | 无口径决策 |
| inventory_turnover_days | （空） | ratio_policy | 平均库存金额 / 统计周期内日均销售成本（商家侧库存效率，平台聚合口径） | 未构成 8 族口径决策（直计/去重/继承类） |
| take_rate | refund_adjustment | ratio_policy | 佣金收入 / GMV，衡量平台从交易中提取价值的比例 |  |
| gmv_per_seller | （空） | ratio_policy | GMV / 动销商家数 | 无口径决策 |
| arpu | refund_adjustment | ratio_policy | GMV / 活跃用户数（分母默认访问活跃） |  |
| marketing_roi | attribution_window | ratio_policy | 归因到投放渠道的 GMV / 投放费用（归因窗口默认 7 日点击） |  |
| marketing_gmv_share | scope_inclusion | ratio_policy | 参与营销活动（大促/券/补贴）订单的 GMV / 总 GMV |  |
| subsidy_rate | fee_composition | ratio_policy | 默认不含平台承担的运费补贴 |  |
| logistics_cost_per_order | （空） | ratio_policy | 总物流成本 / 支付订单数 | 无口径决策 |
| customer_service_cost_per_order | （空） | ratio_policy | 总客服成本（人力 + 智能客服） / 支付订单数 | 无口径决策 |
| activation_rate | validity_threshold | ratio_policy | 新注册用户在注册后 7 日内完成关键行为（默认：首单浏览 ≥3 个商品详情）的占… |  |
| first_order_within_7d_rate | （空） | ratio_policy | 新注册用户在注册后 7 日内完成首笔支付成功的占比 | 无口径决策 |
| search_to_detail_cvr | （空） | ratio_policy | 搜索后点击进入商品详情的用户数 / 搜索用户数 | 无口径决策 |
| detail_to_cart_rate | （空） | ratio_policy | 浏览商品详情后加入购物车的用户数 / 详情页用户数 | 无口径决策 |
| cart_to_order_rate | （空） | ratio_policy | 购物车内商品最终支付成功的用户数 / 加购用户数 | 无口径决策 |
| silent_user_share | validity_threshold + measurement_anchor | ratio_policy | 近 90 日无任何访问的存量用户 / 期末存量用户 |  |
| comeback_rate | （空） | ratio_policy | 触达的沉默用户在 14 日内回访的占比 | 无口径决策 |
| session_avg_duration | validity_threshold | （空） | 单次有效访问的平均时长（秒），剔除 <5 秒的误触访问 |  |

小计：填 28 / 空 25 / aggregation 36 / 多值 3

## SaaS 订阅（saas-subscription.yaml，48 指标）

| 指标名 | caliber_type | aggregation | 依据摘句（definition 原文） | 留空理由 |
|---|---|---|---|---|
| mrr | scope_inclusion + proration_rule | （空） | 默认不含试用，年费按月分摊 |  |
| arr | proration_rule | （空） | 月度经常性收入 × 12 |  |
| new_mrr | （空） | （空） | 统计周期内新客户带来的 MRR 增量 | 无口径决策 |
| expansion_mrr | （空） | （空） | 统计周期内存量客户升级 / 加购席位带来的 MRR 增量 | 未构成 8 族口径决策（直计/去重/继承类） |
| contraction_mrr | （空） | （空） | 统计周期内存量客户降级 / 减席位导致的 MRR 减少（非流失） | 未构成 8 族口径决策（直计/去重/继承类） |
| churned_mrr | （空） | （空） | 统计周期内取消订阅客户带走的 MRR | 无口径决策 |
| nrr | （空） | ratio_policy | (期初 MRR + 新增 + 扩张 − 收缩 − 流失) / 期初 MRR | 无口径决策 |
| active_subscription_count | （空） | （空） | 统计周期末处于有效付费状态的订阅数（一个客户可有多个订阅） | 未构成 8 族口径决策（直计/去重/继承类） |
| paid_account_count | （空） | （空） | 统计周期末至少持有一个有效付费订阅的去重客户数 | 未构成 8 族口径决策（直计/去重/继承类） |
| paid_seats_count | scope_inclusion | （空） | 统计周期末所有有效订阅的付费席位合计 |  |
| mau | validity_threshold | （空） | 自然月内至少一次有效登录的去重用户数（有效登录 = 会话 ≥60 秒） |  |
| wau | （空） | （空） | 自然周内至少一次有效登录的去重用户数 | 未构成 8 族口径决策（直计/去重/继承类） |
| signup_count | scope_inclusion | （空） | 统计周期内完成注册的去重新用户数（含自助注册与销售录入） |  |
| trial_count | scope_inclusion | （空） | 统计周期内开始试用（含免费试用与 POC）的客户数 |  |
| new_customer_count | （空） | （空） | 统计周期内首次转为付费的客户数 | 无口径决策 |
| trial_to_paid_rate | （空） | ratio_policy | 统计周期内试用转付费客户数 / 试用开始客户数 | 未构成 8 族口径决策（直计/去重/继承类） |
| trial_converted_count | （空） | （空） | 统计周期内试用结束后转为付费的客户数 | 未构成 8 族口径决策（直计/去重/继承类） |
| logo_churn_rate | （空） | ratio_policy | 统计周期内流失客户数 / 期初付费客户数 | 无口径决策 |
| churned_account_count | （空） | （空） | 统计周期内取消全部订阅的客户数 | 无口径决策 |
| mrr_churn_rate | scope_inclusion | ratio_policy | 统计周期内流失 MRR / 期初 MRR（不含收缩，收缩单独计 contract… |  |
| nps | validity_threshold | （空） | 推荐者占比（9–10 分）− 贬损者占比（0–6 分），基于周期性关系调研 |  |
| csat | （空） | （空） | 工单关闭时的满意评分（1–5）平均值 | 无口径决策 |
| first_response_time_minutes | measurement_anchor | （空） | 工单从创建到首次人工响应的平均分钟数（中位数口径） |  |
| resolution_time_hours | measurement_anchor + scope_inclusion | （空） | 工单从创建到解决的平均小时数（中位数口径，不含待客户回复时间） |  |
| uptime_rate | scope_inclusion | ratio_policy | 统计周期内服务可用时间 / 总时间（按 SLA 口径剔除计划内维护） |  |
| incident_count | validity_threshold | （空） | 统计周期内 P1–P3 级生产故障次数合计 |  |
| activation_rate | validity_threshold | ratio_policy | 新付费客户在签约后 30 日内完成关键行为（默认：核心功能被 ≥3 名成员使用）… |  |
| enterprise_revenue_share | （空） | ratio_policy | KA（大客户）分层贡献的 ARR / 总 ARR | 无口径决策 |
| self_serve_share | scope_inclusion | ratio_policy | 自助注册付费（无销售介入）的 ARR / 总 ARR |  |
| top10_customer_arr_share | （空） | ratio_policy | ARR 前 10 名客户合计 / 总 ARR，衡量收入对头部客户的依赖 | 无口径决策 |
| multi_product_share | validity_threshold | ratio_policy | 购买 ≥2 条产品线的客户数 / 付费客户数 |  |
| annual_contract_share | scope_inclusion | ratio_policy | 年付（及以上）合同的 MRR / 总 MRR |  |
| channel_partner_share | （空） | ratio_policy | 经渠道伙伴成交的 ARR / 总 ARR | 未构成 8 族口径决策（直计/去重/继承类） |
| arpa | （空） | ratio_policy | MRR / 付费客户数 | 无口径决策 |
| avg_customer_lifetime_months | measurement_anchor | （空） | 1 / 月度客户流失率（按 12 个月移动平均流失率折算），单位月 |  |
| ltv | fee_composition | （空） | 客户平均收入 × 平均客户生命周期（毛利口径调整由 caliber 开关控制） |  |
| sales_marketing_spend | （空） | （空） | 统计周期内销售与市场费用合计（人力 + 投放 + 活动分配） | 无口径决策 |
| cac | （空） | ratio_policy | 销售营销费用 / 新客户数 | 无口径决策 |
| ltv_cac_ratio | （空） | ratio_policy | 客户生命周期价值 / 获客成本 | 无口径决策 |
| cac_payback_months | （空） | ratio_policy | 获客成本 / 客户平均收入 | 无口径决策 |
| gross_margin_rate | （空） | ratio_policy | (订阅收入 − 直接成本（云资源 + 交付支持成本）) / 订阅收入 | 无口径决策 |
| arpu | （空） | ratio_policy | MRR / 月活跃用户数，衡量产品货币化深度 | 未构成 8 族口径决策（直计/去重/继承类） |
| support_cost_per_account | （空） | ratio_policy | 总支持成本（人力 + 工具）/ 付费客户数 | 无口径决策 |
| trial_activation_rate | validity_threshold | ratio_policy | 试用客户在试用期内完成关键行为（默认：邀请 ≥1 名成员 + 使用核心功能 3 … |  |
| onboarding_completion_rate | （空） | ratio_policy | 新客户在 14 日内完成 onboarding 清单全部步骤的占比 | 无口径决策 |
| license_utilization_rate | validity_threshold | ratio_policy | 近 30 日活跃席位 / 付费席位合计，衡量超卖风险与续约健康度 |  |
| login_frequency | （空） | （空） | 活跃用户每周平均登录次数（按周去重用户折算） | 未构成 8 族口径决策（直计/去重/继承类） |
| sticky_wau_mau | （空） | ratio_policy | 周活跃用户数 / 月活跃用户数 | 未构成 8 族口径决策（直计/去重/继承类） |

小计：填 20 / 空 28 / aggregation 23 / 多值 2

## 内容社区 App（content-community.yaml，43 指标）

| 指标名 | caliber_type | aggregation | 依据摘句（definition 原文） | 留空理由 |
|---|---|---|---|---|
| dau | validity_threshold | （空） | 当日至少一次有效访问（会话 ≥5 秒）的去重用户数 |  |
| wau | （空） | （空） | 自然周内至少一次有效访问的去重用户数 | 未构成 8 族口径决策（直计/去重/继承类） |
| mau | （空） | （空） | 自然月内至少一次有效访问的去重用户数 | 未构成 8 族口径决策（直计/去重/继承类） |
| new_user_count | scope_inclusion | （空） | 统计周期内完成注册（含三方授权）的去重新用户数 |  |
| publish_count | （空） | （空） | 统计周期内通过审核的 UGC/PGC 内容发布条数 | 无口径决策 |
| creator_count | （空） | （空） | 统计周期内至少发布 1 条过审内容的去重创作者数 | 未构成 8 族口径决策（直计/去重/继承类） |
| total_play_count | validity_threshold | （空） | 统计周期内内容（视频/图文）有效播放次数，有效 = 播放 ≥3 秒 |  |
| interaction_count | （空） | （空） | 统计周期内点赞、评论、收藏、分享行为次数合计 | 无口径决策 |
| ad_impression_count | validity_threshold | （空） | 统计周期内广告有效曝光次数（可见 ≥1 秒） |  |
| ad_revenue | fee_composition | （空） | 统计周期内广告收入（按媒体侧口径确认，不含代理商返点） |  |
| creator_income | （空） | （空） | 统计周期内应付给创作者的流量分成 + 打赏 + 付费订阅分成合计 | 无口径决策 |
| video_avg_play_duration | （空） | （空） | 视频内容的人均单条播放时长（秒），按有效播放折算 | 未构成 8 族口径决策（直计/去重/继承类） |
| session_count | （空） | （空） | 统计周期内有效访问会话次数（间隔 ≥30 分钟切分） | 未构成 8 族口径决策（直计/去重/继承类） |
| next_day_retention | （空） | ratio_policy | 新用户次日再次活跃的占比 | 未构成 8 族口径决策（直计/去重/继承类） |
| retention_30d | （空） | ratio_policy | 新用户 30 日内再次活跃的占比 | 未构成 8 族口径决策（直计/去重/继承类） |
| avg_session_duration | （空） | ratio_policy | 总会话时长 / 会话数（秒） | 无口径决策 |
| content_completion_rate | validity_threshold | ratio_policy | 播放进度 ≥80% 的播放次数 / 有效播放次数（视频类核心质量） |  |
| interaction_rate | （空） | ratio_policy | 互动量 / 有效播放量 | 未构成 8 族口径决策（直计/去重/继承类） |
| share_rate | （空） | ratio_policy | 分享次数 / 有效播放次数，衡量内容传播力 | 未构成 8 族口径决策（直计/去重/继承类） |
| creator_retention_90d | measurement_anchor | ratio_policy | 首发内容创作者 90 日内再次发布的占比，供给侧健康度核心 |  |
| content_complaint_rate | （空） | ratio_policy | 被举报内容数 / 过审内容数，内容安全与质量底线 | 无口径决策 |
| creator_active_rate | （空） | ratio_policy | 统计周期内发布内容的创作者 / 存量注册创作者 | 无口径决策 |
| csat_community | （空） | （空） | 周期性调研的社区体验满意评分（1–5 均值） | 无口径决策 |
| category_top3_play_share | （空） | ratio_policy | 播放量最高三个品类的合计占比，衡量内容生态多样性 | 无口径决策 |
| head_creator_content_share | （空） | ratio_policy | 头部分层（TOP 5% 创作者）发布内容的播放占比，供给侧集中度 | 无口径决策 |
| ugc_pgc_share | （空） | ratio_policy | 机构/专业创作者内容的播放占比（其余为 UGC） | 无口径决策 |
| recommend_traffic_share | （空） | ratio_policy | 推荐分发带来的播放量 / 总播放量（其余为搜索、关注、直达） | 无口径决策 |
| new_creator_content_share | measurement_anchor | ratio_policy | 注册 90 日内创作者发布内容的播放占比，供给侧新鲜度 |  |
| ad_load_rate | （空） | ratio_policy | 广告曝光次数 / 内容播放次数 | 无口径决策 |
| arpu | （空） | ratio_policy | 广告收入 / 日活跃用户数（按日折算） | 未构成 8 族口径决策（直计/去重/继承类） |
| rpm | （空） | ratio_policy | 广告收入 × 1000 / 有效播放量，内容流量的变现效率 | 未构成 8 族口径决策（直计/去重/继承类） |
| ecpm | （空） | ratio_policy | 广告收入 × 1000 / 广告有效曝光量 | 未构成 8 族口径决策（直计/去重/继承类） |
| cost_per_dau | （空） | ratio_policy | （带宽 + 服务器 + CDN）成本 / 日活跃用户数 | 未构成 8 族口径决策（直计/去重/继承类） |
| creator_income_share | （空） | ratio_policy | 创作者分成收入 / 广告收入，供给侧激励投入强度 | 无口径决策 |
| recommend_ctr | （空） | ratio_policy | 推荐曝光后点击进入内容的次数 / 推荐曝光次数 | 无口径决策 |
| content_review_efficiency | （空） | ratio_policy | 过审内容数 / 审核人力（人日），内容安全运营效率 | 无口径决策 |
| impression_to_click_rate | （空） | ratio_policy | 内容曝光后点击进入的次数 / 曝光次数，标题封面吸引力 | 无口径决策 |
| click_to_finish_rate | validity_threshold | ratio_policy | 点击进入后完成播放（≥80%）的占比，内容承接力 |  |
| play_to_interact_rate | （空） | ratio_policy | 产生互动的播放次数 / 有效播放次数 | 未构成 8 族口径决策（直计/去重/继承类） |
| browse_to_publish_rate | （空） | ratio_policy | 活跃用户中发布内容的占比，消费到创作的转化 | 未构成 8 族口径决策（直计/去重/继承类） |
| first_publish_within_7d_rate | （空） | ratio_policy | 新注册用户 7 日内发布首条内容的占比 | 无口径决策 |
| push_open_rate | （空） | ratio_policy | 推送送达后 24 小时内打开的占比 | 无口径决策 |
| search_to_play_rate | （空） | ratio_policy | 搜索后点击播放的次数 / 搜索次数 | 无口径决策 |

小计：填 9 / 空 34 / aggregation 29 / 多值 0

## 数字营销（digital-marketing.yaml，40 指标）

| 指标名 | caliber_type | aggregation | 依据摘句（definition 原文） | 留空理由 |
|---|---|---|---|---|
| ad_spend | fee_composition | （空） | 统计周期内广告实际消耗金额（含媒体 + 代理服务费 |  |
| impression_count | validity_threshold | （空） | 统计周期内广告有效曝光次数（可见 ≥1 秒） |  |
| click_count | validity_threshold | （空） | 统计周期内广告有效点击次数（剔除误触：点击后停留 <2 秒） |  |
| reach_count | （空） | （空） | 统计周期内被广告触达的去重人数 | 未构成 8 族口径决策（直计/去重/继承类） |
| frequency | （空） | ratio_policy | 曝光量 / 触达人数，频控与健康度（信息流健康线 ≤5） | 无口径决策 |
| lead_count | validity_threshold | （空） | 默认剔除明显无效线索（测试单、空号） |  |
| mql_count | （空） | （空） | 通过市场侧评分（画像匹配 + 行为分）的线索数 | 无口径决策 |
| sql_count | （空） | （空） | 销售确认可跟进（有效联系方式 + 明确需求）的线索数 | 未构成 8 族口径决策（直计/去重/继承类） |
| conversion_count | attribution_window | （空） | 归因到广告曝光/点击的转化事件数（下单/支付/激活），默认 7 日点击归因 |  |
| converted_revenue | attribution_window | （空） | 归因到广告的转化订单金额合计（归因口径与转化量一致） |  |
| ctr | （空） | ratio_policy | 有效点击 / 有效曝光，创意与人群匹配度 | 未构成 8 族口径决策（直计/去重/继承类） |
| cvr | （空） | ratio_policy | 转化量 / 有效点击量，承接页与人群精准度 | 未构成 8 族口径决策（直计/去重/继承类） |
| lead_qualified_rate | （空） | ratio_policy | MQL 数 / 线索量，流量质量的核心 | 无口径决策 |
| mql_to_sql_rate | （空） | ratio_policy | SQL 数 / MQL 数，市场与销售衔接质量 | 无口径决策 |
| bounce_rate | validity_threshold | ratio_policy | 点击后仅浏览落地页即离开的占比（停留 <10 秒且无二次行为） |  |
| invalid_click_rate | （空） | ratio_policy | 被反作弊识别的无效点击（机器/竞对/误触）/ 总点击，流量真实性 | 无口径决策 |
| brand_safety_violation_rate | （空） | ratio_policy | 曝露在不合规内容旁的广告曝光占比 | 无口径决策 |
| creative_fatigue_rate | validity_threshold | ratio_policy | 同一素材对同一用户曝光 ≥3 次的曝光占比，创意衰退预警 |  |
| engagement_rate | （空） | ratio_policy | 广告互动（赞/评/转/收藏）次数 / 有效曝光次数 | 未构成 8 族口径决策（直计/去重/继承类） |
| channel_spend_share | （空） | ratio_policy | 单渠道消耗 / 总消耗，预算分配结构 | 未构成 8 族口径决策（直计/去重/继承类） |
| search_vs_feed_share | （空） | ratio_policy | 搜索渠道消耗 / 总消耗（其余为信息流/视频等主动分发） | 未构成 8 族口径决策（直计/去重/继承类） |
| new_vs_retargeting_share | scope_inclusion | ratio_policy | 再营销（老客/已互动人群）消耗 / 总消耗 |  |
| audience_top3_spend_share | （空） | ratio_policy | 消耗最高三个人群包合计占比，人群集中度 | 无口径决策 |
| creative_type_share | （空） | ratio_policy | 视频类素材消耗 / 总消耗（其余为图文/互动） | 无口径决策 |
| roas | （空） | ratio_policy | 归因收入 / 广告消耗 | 未构成 8 族口径决策（直计/去重/继承类） |
| cpc | （空） | ratio_policy | 广告消耗 / 有效点击量 | 未构成 8 族口径决策（直计/去重/继承类） |
| cpm | （空） | ratio_policy | 广告消耗 × 1000 / 有效曝光量 | 未构成 8 族口径决策（直计/去重/继承类） |
| cpa | （空） | ratio_policy | 广告消耗 / 转化量 | 无口径决策 |
| cpl | （空） | ratio_policy | 广告消耗 / 线索量 | 无口径决策 |
| cost_per_qualified_lead | （空） | ratio_policy | 广告消耗 / MQL 数，流量质量的成本视角 | 无口径决策 |
| cac | （空） | ratio_policy | （广告 + 渠道分成）总获客费用 / 新成交客户数 | 未构成 8 族口径决策（直计/去重/继承类） |
| budget_utilization_rate | （空） | ratio_policy | 实际消耗 / 计划预算，投放执行健康度（健康区间 90–105%） | 无口径决策 |
| bid_win_rate | （空） | ratio_policy | 胜出的竞价次数 / 参与竞价次数 | 无口径决策 |
| viewability_rate | validity_threshold | ratio_policy | 满足可视标准（≥50% 区域 ≥1 秒）的曝光占比 |  |
| click_to_lead_rate | （空） | ratio_policy | 线索量 / 有效点击量 | 未构成 8 族口径决策（直计/去重/继承类） |
| lead_to_mql_rate | （空） | ratio_policy | MQL 数 / 线索量 | 无口径决策 |
| landing_page_conversion_rate | scope_inclusion | ratio_policy | 落地页访客中完成目标行为（留资/下单）的占比 |  |
| form_abandon_rate | （空） | ratio_policy | 开始填写表单但未提交的占比 | 无口径决策 |
| attribution_lag_days | measurement_anchor | （空） | 转化事件相对首次广告触达的平均滞后天数 |  |
| lp_load_time_seconds | （空） | （空） | 落地页首屏完全加载的平均秒数（P75 口径），加载每慢 1 秒转化率显著衰减 | 未构成 8 族口径决策（直计/去重/继承类） |

小计：填 12 / 空 28 / aggregation 29 / 多值 0

## 供应链物流（supply-chain-logistics.yaml，40 指标）

| 指标名 | caliber_type | aggregation | 依据摘句（definition 原文） | 留空理由 |
|---|---|---|---|---|
| order_fulfillment_count | scope_inclusion | （空） | 不含取消单） |  |
| shipment_count | （空） | （空） | 统计周期内交承运发出的包裹/发运单数（一订单可拆多发运单） | 无口径决策 |
| outbound_volume | （空） | （空） | 统计周期内出库作业的总件数（SKU 计数） | 无口径决策 |
| inbound_volume | （空） | （空） | 统计周期内收货上架的总件数 | 无口径决策 |
| inventory_value | scope_inclusion + fee_composition + measurement_anchor | （空） | 期末在库库存的账面金额（标准成本口径，在途不计） |  |
| sku_count | （空） | （空） | 期末有库存的 SKU 数量 | 无口径决策 |
| active_warehouse_count | （空） | （空） | 期末处于启用运营状态的仓点数 | 无口径决策 |
| supplier_count | （空） | （空） | 统计周期内有实际供货的供应商数 | 无口径决策 |
| return_order_count | （空） | （空） | 统计周期内客户发起并受理的退货单数 | 未构成 8 族口径决策（直计/去重/继承类） |
| return_rate | （空） | ratio_policy | 退货单数 / 履约订单数 | 未构成 8 族口径决策（直计/去重/继承类） |
| otif | measurement_anchor | ratio_policy | 按承诺时间足量签收的订单数 / 应交付订单数，SCOR 履约质量总闸 |  |
| on_time_shipment_rate | measurement_anchor | ratio_policy | 按承诺时效完成发出的发运单数 / 应发运单数 |  |
| order_accuracy_rate | （空） | ratio_policy | 无错发/漏发/串货的订单数 / 履约订单数 | 无口径决策 |
| damage_rate | （空） | ratio_policy | 运输/仓储环节破损件数 / 出库件数 | 无口径决策 |
| perfect_order_rate | （空） | （空） | 准时 × 准确 × 完好的联合概率，SCOR 综合履约质量 | 无口径决策 |
| supplier_otif_rate | measurement_anchor | ratio_policy | 供应商按约定日期足量到货的订单数 / 采购到货订单数 |  |
| forecast_accuracy_rate | cap_anomaly_rule | ratio_policy | 1 − |实际需求 − 预测| / 实际需求（MAPE 反算），需求计划质量 |  |
| stockout_rate | （空） | ratio_policy | 因库存不足导致无法履约的订单行数 / 订单总行数 | 无口径决策 |
| backorder_rate | （空） | ratio_policy | 处于待补货状态的订单行数 / 订单总行数，缺货深度 | 无口径决策 |
| invoice_match_rate | （空） | ratio_policy | 与承运商/供应商账单一次对账一致的费用行占比 | 无口径决策 |
| abc_sku_share | validity_threshold | ratio_policy | 按 GMV/出库金额累计 80% 的 A 类 SKU 数 / 在库 SKU 数 |  |
| slow_moving_inventory_share | validity_threshold | ratio_policy | 库龄 >90 天无出库动销的库存金额 / 库存金额 |  |
| supplier_top3_spend_share | （空） | ratio_policy | 采购金额前 3 供应商合计占比，供应风险集中度 | 无口径决策 |
| region_volume_share | （空） | ratio_policy | 单区域出库件数 / 总出库件数，仓网辐射结构 | 无口径决策 |
| transport_mode_share | （空） | ratio_policy | 快运/专线条数占比（其余为快递零担），干线结构 | 无口径决策 |
| capacity_utilization_rate | （空） | ratio_policy | 在用库容 / 可用库容，仓储产能健康线 70–85% | 无口径决策 |
| inventory_turnover_days | （空） | ratio_policy | 平均库存金额 / 日均出库成本，资金占用效率核心 | 无口径决策 |
| inventory_turnover_rate | （空） | （空） | 年化周转次数 = 365 / 库存周转天数 | 无口径决策 |
| fulfillment_cost_per_order | fee_composition | ratio_policy | （仓储 + 分拣 + 包装 + 配送）总履约成本 / 履约订单数 |  |
| logistics_cost_per_order | （空） | ratio_policy | 干线 + 末端配送成本合计 / 履约订单数 | 无口径决策 |
| cost_per_unit_shipped | （空） | ratio_policy | 总发运成本 / 出库件数 | 无口径决策 |
| truck_utilization_rate | （空） | ratio_policy | 干线车辆实际装载体积 / 车厢容积 | 无口径决策 |
| warehouse_labor_productivity | （空） | ratio_policy | 出入库总件数 / 仓储人力（人日） | 无口径决策 |
| order_cycle_time_hours | measurement_anchor | （空） | 订单下达到签收的平均小时数（P50） |  |
| dock_to_stock_hours | measurement_anchor | （空） | 供应商到货到完成上架的可销售状态平均小时数 |  |
| order_to_ship_hours | measurement_anchor | （空） | 订单下达到交承运发出的平均小时数（P50） |  |
| ship_to_deliver_days | measurement_anchor | （空） | 发运到客户签收的平均自然日（P50） |  |
| exception_rate | （空） | ratio_policy | 异常（破损/丢失/拒收/地址错误）发运单数 / 发运单数 | 未构成 8 族口径决策（直计/去重/继承类） |
| exception_resolve_hours | measurement_anchor | （空） | 异常工单创建到关闭的平均小时数 |  |
| rma_processing_days | measurement_anchor | （空） | 退货受理到完成质检入库/报废的平均天数 |  |

小计：填 15 / 空 25 / aggregation 23 / 多值 1

## 云成本 FinOps（cloud-cost.yaml，40 指标）

| 指标名 | caliber_type | aggregation | 依据摘句（definition 原文） | 留空理由 |
|---|---|---|---|---|
| total_cloud_cost | fee_composition | （空） | 统计周期内云厂商账单费用合计（含折扣与承诺抵扣后净额 |  |
| compute_cost | （空） | （空） | 云主机/容器/Serverless 计算费用合计 | 无口径决策 |
| storage_cost | （空） | （空） | 对象存储/块存储/备份归档费用合计 | 无口径决策 |
| network_cost | （空） | （空） | 公网流量/带宽/CDN/跨区传输费用合计 | 无口径决策 |
| database_cost | （空） | （空） | 托管数据库（RDS/NoSQL/数仓）费用合计 | 无口径决策 |
| paas_saas_cost | （空） | （空） | 中间件/可观测/AI 服务等 PaaS 与 SaaS 订阅费用 | 无口径决策 |
| license_cost | （空） | （空） | 商业软件许可（含云市场订阅）费用 | 无口径决策 |
| running_instance_count | （空） | （空） | 期末处于运行状态的云主机/容器实例数 | 无口径决策 |
| data_transfer_volume | （空） | （空） | 统计周期内公网出流量（GB），网络成本驱动因子 | 无口径决策 |
| storage_capacity_tb | （空） | （空） | 期末占用存储容量（TB），存储成本驱动因子 | 无口径决策 |
| business_revenue | （空） | （空） | 统计周期内业务总收入（财务口径），云成本效率的分母锚点 | 未构成 8 族口径决策（直计/去重/继承类） |
| transaction_count | （空） | （空） | 统计周期内核心业务交易/请求事件数，单位成本的业务量分母 | 无口径决策 |
| budget_variance_rate | （空） | ratio_policy | （实际云成本 − 预算）/ 预算 | 无口径决策 |
| cost_anomaly_count | cap_anomaly_rule | （空） | 统计周期内检测到的成本异常事件数（环比突增 >30% 且超绝对阈值） |  |
| cost_anomaly_resolve_hours | measurement_anchor | （空） | 异常检测到确认关闭的平均小时数 |  |
| idle_resource_rate | validity_threshold | ratio_policy | 低利用率资源（CPU <5% 持续 7 天）的费用占比，优化机会清单 |  |
| untagged_resource_rate | （空） | ratio_policy | 缺少归属标签的费用占比，分摊与治理的前提 | 未构成 8 族口径决策（直计/去重/继承类） |
| forecast_accuracy_rate | （空） | ratio_policy | 1 − |实际 − 预测| / 实际（月度云成本口径） | 未构成 8 族口径决策（直计/去重/继承类） |
| billing_error_rate | （空） | ratio_policy | 复核发现计费错误的账单行占比（承诺抵扣未生效、重复计费等） | 未构成 8 族口径决策（直计/去重/继承类） |
| commitment_expiry_risk_count | measurement_anchor | （空） | 未来 90 天内到期的预留/节省计划承诺数量，续约风险预警 |  |
| cost_by_service_share | （空） | ratio_policy | 单服务类型（计算/存储/网络/数据库）费用 / 云成本总额 | 无口径决策 |
| cost_by_department_share | （空） | ratio_policy | 已分摊到部门的费用 / 云成本总额（其余为共享未分摊） | 未构成 8 族口径决策（直计/去重/继承类） |
| prod_vs_nonprod_share | （空） | ratio_policy | 测试/开发/预发环境费用 / 云成本总额 | 无口径决策 |
| ondemand_vs_reserved_share | （空） | ratio_policy | 按需计费费用 / 可承诺类（计算/数据库）费用合计，承诺覆盖不足信号 | 未构成 8 族口径决策（直计/去重/继承类） |
| provider_multi_share | （空） | ratio_policy | 非主力云厂商费用 / 云成本总额，多云策略集中度 | 无口径决策 |
| cost_efficiency_ratio | （空） | ratio_policy | 业务收入 / 云成本总额，单位云成本创造的业务价值 | 无口径决策 |
| cost_per_transaction | （空） | ratio_policy | 云成本总额 / 业务交易量 | 无口径决策 |
| cost_per_customer | （空） | ratio_policy | 云成本总额 / 活跃客户数，SaaS 单位经济核心 | 未构成 8 族口径决策（直计/去重/继承类） |
| reserved_coverage_rate | （空） | ratio_policy | 预留实例覆盖的费用 / 可承诺类费用合计 | 未构成 8 族口径决策（直计/去重/继承类） |
| savings_plan_utilization | （空） | ratio_policy | 节省计划实际抵扣金额 / 承诺金额，承诺浪费监控 | 未构成 8 族口径决策（直计/去重/继承类） |
| spot_usage_rate | （空） | ratio_policy | 竞价实例费用 / 计算费用合计，可中断负载的成本红利 | 无口径决策 |
| rightsizing_savings_rate | （空） | ratio_policy | 已完成降配/缩容的月度节省 / 优化前基线费用 | 无口径决策 |
| license_utilization_rate | （空） | ratio_policy | 实际使用席位/调用量 / 已购许可容量 | 未构成 8 族口径决策（直计/去重/继承类） |
| autoscaling_adoption_rate | （空） | ratio_policy | 接入自动伸缩的计算费用 / 可弹性计算费用合计 | 无口径决策 |
| allocation_coverage_rate | （空） | ratio_policy | 已按标签/规则分摊到成本中心的费用 / 云成本总额 | 未构成 8 族口径决策（直计/去重/继承类） |
| tag_compliance_rate | （空） | ratio_policy | 按标签规范完整打标的资源数 / 应打标资源数 | 无口径决策 |
| showback_adoption_rate | （空） | ratio_policy | 月度查看成本看板的部门数 / 应查看部门数，成本意识普及 | 无口径决策 |
| optimization_cycle_days | measurement_anchor | （空） | 优化建议产生到确认执行（或否决）的平均天数 |  |
| chargeback_dispute_rate | （空） | ratio_policy | 部门对分摊账单提出争议的费用占比 | 未构成 8 族口径决策（直计/去重/继承类） |
| cost_per_tb_stored | （空） | ratio_policy | 存储成本 / 平均存储容量（TB），存储单价效率 | 无口径决策 |

小计：填 6 / 空 34 / aggregation 24 / 多值 0

## 总统计（batch2）

caliber_type 填 90 / 空 174；aggregation 填 164；多值 6。SOP 基准沿用试点：measurement_anchor 仅非默认锚；粒度支持声明 ≠ disallowed；宁缺毋滥。
