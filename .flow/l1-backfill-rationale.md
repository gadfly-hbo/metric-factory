# 服饰模板 L1 回填 · 逐指标判定留档

> 批次：④ 切片 0「服饰模板 L1 回填」。对象：`templates/apparel-brand-retail.yaml`（72 指标）。
> 规则源：`.flow/prd.md` Implementation Decisions（Q1 全量判定 / Q2 aggregation 最小可辩护集 / Q3 本留档格式）。
> 铁律：无依据即留空；单值优先，仅真实跨族才多值。

## 判定基准（跨指标一致的两条尺度）

1. **measurement_anchor 赋值尺度**：常规报告约定「统计时间按照订单支付时间计算」（gmv / terminal_sales / retail_refund_amount / return_parcel_rate）不单独构成口径族；仅非默认锚赋值——事件对时长（6 个物流时效）、期末/所选时点快照（库存市值类）、累计窗（累销/周转）、特殊确认时点（预售付清当天/货到付款确认收货）。
2. **gmv「仅支持店铺维度」未填 disallowed_dimensions**：该句是数据粒度支持声明，且与指标自身 `dimensions: [brand, channel, store, region]` 存在张力，按「宁缺毋滥」留空，交 controller 裁决是否属规则②适用面。

## 逐指标判定表

| 指标名 | caliber_type | aggregation | 依据（definition/口径摘句 ≤30 字） | 留空理由 |
|---|---|---|---|---|
| gmv | refund_adjustment + scope_inclusion | — | 「未减退款前」+ 含直营/加盟/电商；switches: deduct_refund、include_view_as_sale/o2o/live_stream | |
| terminal_sales | refund_adjustment + scope_inclusion | — | 「未减退款前销售额统计值，包含直营、加盟、电商等」 | |
| retail_refund_amount | refund_adjustment | — | 「包含未发货仅退款、已发货仅退款、退货退款…额外退款额」 | |
| retail_sales | refund_adjustment | — | 「销售额扣减退款后的实际销售金额」 | |
| retail_volume | refund_adjustment | — | 「销售量扣减退货后的实际销售数量」 | |
| atv | — | ratio_policy | 「线上：支付金额/支付买家数；线下：终端成交额/订单数」 | 无口径决策（线上/线下分子差异无族匹配） |
| order_count | refund_adjustment | — | 「买家下单支付产生的订单数量（剔除退货）」 | |
| paid_amount | refund_adjustment + measurement_anchor | — | 「未剔除事后退款金额」+「付清当天才计入/确认收货时计入」 | |
| traffic | — | — | | 无口径决策（线上/线下为度量方式差异，无取舍决策） |
| conversion_rate | — | ratio_policy | 「（订单数+支付买家数）/（线上客流量+线下客流量）」 | 无口径决策 |
| store_traffic | validity_threshold | — | 「门店转化率在1%到50%之间的门店的客流数」 | |
| store_receipts | refund_adjustment | — | 「除去退款及退货交易订单」 | |
| store_conversion | — | ratio_policy | 「门店小票数/门店客流量」 | 无口径决策 |
| upt | — | ratio_policy | 「门店零售量/门店小票数」 | 无口径决策 |
| o2o_sales | refund_adjustment + scope_inclusion | — | 「扣减退款后」+ O2O 界定（触点线上门店＋门店仓发货） | |
| live_stream_sales | refund_adjustment | — | 「直播挂链扣减退款后的实际销售金额」 | |
| new_store_count | measurement_anchor + scope_inclusion | — | 「门店首次零售时间在统计的时间段内」+ 渠道类型七类清单 | |
| closed_store_count | validity_threshold + scope_inclusion | — | 「最后一次产生销售的时间…超过2个月，视为关店」+ 渠道类型清单 | |
| new_store_sales | — | — | | 其他——口径继承【零售额】，自身无口径决策 |
| sales_per_sqm | — | ratio_policy | 「门店每平米的销售额（默认年平效）」 | 无口径决策 |
| comparable_store_sales | scope_inclusion | — | 「可比店指…打标，并计算对应标签的零售额」 | |
| tag_price | fee_composition | — | 「不含实际成交折扣」 | |
| retail_value | refund_adjustment | — | 「销售量扣减退货后的实际销售商品的市值」 | |
| retail_discount | — | ratio_policy | 「终端零售额/终端零售市值」 | 无口径决策 |
| inventory_value | scope_inclusion + measurement_anchor | — | switch include_franchise_inventory +「所选时间点的在库库存市值」 | |
| on_hand_inventory_value | measurement_anchor | — | 「所选时间点已经在手的存货数市值」 | |
| cumulative_retail_value | refund_adjustment + measurement_anchor | — | 「净销量*吊牌价」（净＝扣减退货）+「从约定的开始日期到截止日」 | |
| purchase_inbound_value | — | — | | 其他——统计周期内入库数量×吊牌价直计，无口径决策 |
| allocation_value | scope_inclusion | — | 「总仓对加盟经销商的销售出库的商品市值」 | |
| net_allocation_value | refund_adjustment + scope_inclusion | — | 「运营模式为加盟的配发市值 - 配发退货数量*吊牌价」 | |
| sell_through_rate | — | ratio_policy | 「零售市值占总进货市值的比例」 | 无口径决策（分子分母继承上游口径） |
| cumulative_sell_through_rate | scope_inclusion | ratio_policy | switch include_in_transit_inventory +「占总进货市值的比例」 | |
| inbound_sell_through_rate | scope_inclusion | disallowed=[channel] + ratio_policy | 「限定单一产品季」+「不建议区分线下电商使用」 | |
| otb_sell_through_rate | scope_inclusion | ratio_policy | 「限定单一产品季后使用」+「累计零售市值占OTB的比例」 | |
| purchase_sell_through_rate | scope_inclusion | ratio_policy | 「限定单一产品季后使用」+「占公司累计采购市值的比例」 | |
| new_product_sell_through_rate | scope_inclusion | ratio_policy | 「新品零售市值累计值/新品净配发市值累计值」 | |
| inventory_turnover_days | scope_inclusion + measurement_anchor | — | 「线下…包含O2O，电商…不含O2O」+「每月期末库存市值…不含未结束月」 | |
| coverage_rate | validity_threshold + scope_inclusion | ratio_policy | 「（7天或14天内）有零售或有库存」+ 触点/运营模式/渠道类型三条件 | |
| member_sales | refund_adjustment | — | 「会员订单净销额」（净＝扣减退款，同【零售量】约定） | |
| member_sales_ratio | — | ratio_policy | 「会员销额与零售额的百分比」 | 无口径决策 |
| repurchase_rate | validity_threshold | ratio_policy | 「购买（天）次数在2次及以上的买家数…占全部买家数的比例」 | |
| join_rate | — | ratio_policy | 「会员开卡人数/(非会员订单数+会员开卡人数)」 | 无口径决策 |
| batch_achievement_rate | measurement_anchor | ratio_policy | 「按期交货的订单达成率」（基准＝约定交期事件） | |
| delivery_achievement_rate | measurement_anchor + validity_threshold | ratio_policy | 「按合同货期达成」+「单订单前置交付95%以上算批次达成」 | |
| launch_achievement_rate | measurement_anchor + validity_threshold | ratio_policy | 「按上市日期达成」+「单订单按期达成95%以上算批次达成」 | |
| flexible_supply_days | scope_inclusion | — | 「柔性订单（生产阶段：加翻单）的平均交付周期」 | |
| market_return_defect_rate | refund_adjustment | ratio_policy | 「被退回的数量与同期发货数量之间的比率」 | |
| supplier_return_defect_rate | refund_adjustment | ratio_policy | 「供应商责任退疵数量占整体配发数量比例」 | |
| inbound_pass_rate | — | ratio_policy | 「检验合格数量占入库总数量的比例」 | 无口径决策 |
| final_inspection_pass_rate | — | ratio_policy | 「按批次进行尾检，尾检一次通过的合格率」 | 无口径决策 |
| dev_effective_rate | — | ratio_policy | 「开发的产品款数与保留下来的大货产品款数之间的比率」 | 无口径决策 |
| cost_deviation_rate | — | ratio_policy | 「大货采购费用与核价标准成本费用的偏差率」 | 无口径决策 |
| outbound_pieces | validity_threshold | — | 「商品件数直接汇总，取已完结的订单」 | |
| outbound_orders | — | — | | 其他——「按WMS单号进行去重」为计数规则，非 8 族语义 |
| audit_lead_time | measurement_anchor | — | 「WMS【发运订单表】创建时间-支付时间」 | |
| outbound_lead_time | measurement_anchor | — | 「WMS【发运订单表】发货时间-创建时间」 | |
| handover_lead_time | measurement_anchor | — | 「WMS【发运订单表】快递交接时间-发货时间」 | |
| ship_lead_time | measurement_anchor | — | 「WMS【发运订单表】发货时间-支付时间」 | |
| pickup_lead_time | measurement_anchor | — | 「TMS揽收时间-TMS快递交接时间」 | |
| pickup_sign_lead_time | measurement_anchor | — | 「TMS签收时间-TMS揽收时间」 | |
| return_parcel_rate | refund_adjustment | ratio_policy | 「退货件数/出库件数*100%」 | |
| operating_revenue | fee_composition + refund_adjustment | — | 「不含税收入」+「扣减退货、扣减返利」 | |
| gross_profit | fee_composition | — | 「不包括企业的管理费用、财务费用、销售费用、税收等」 | |
| gross_margin | — | ratio_policy | 「财务毛利额占营业收入的百分比」 | 无口径决策 |
| total_profit | — | — | | 其他——会计期间盈亏总额直计，无口径决策 |
| profit_margin | — | ratio_policy | 「利润总额占营业收入的比例」 | 无口径决策 |
| expense | fee_composition | — | 「不含财务费用(财务费用包含税金及附加费用，存跌，政府补贴等)」 | |
| expense_ratio | — | ratio_policy | 「费用占营业收入的比例」 | 无口径决策 |
| dealership_revenue | fee_composition | — | 「按13%增值税作价税分离；适用税率不同时按实际税率换算」 | |
| dealership_cost | fee_composition | — | 「商品不含税配发单价*零售量」 | |
| dealership_gross_profit | — | — | | 其他——经销收入-经销成本直计，无口径决策 |
| dealership_gross_margin | — | ratio_policy | 「经销毛利额/经销收入」 | 无口径决策 |

## 覆盖率统计

- **caliber_type**：填 **49** / 空 **23**。留空理由分布：无口径决策 **17**（atv、conversion_rate、store_conversion、upt、sales_per_sqm、retail_discount、sell_through_rate、member_sales_ratio、join_rate、inbound_pass_rate、final_inspection_pass_rate、dev_effective_rate、cost_deviation_rate、gross_margin、profit_margin、expense_ratio、dealership_gross_margin）；其他 **6**（traffic、new_store_sales、purchase_inbound_value、outbound_orders、total_profit、dealership_gross_profit，均为直计/规则计数/继承口径）。
- **aggregation**：填 **30** / 空 42。构成：`ratio_policy: recompute_from_parts` ×30（23 个 `type: ratio` + 7 个定义明示分子分母的 derived 率类）；`disallowed_dimensions` ×1（inbound_sell_through_rate=[channel]，依据「不建议区分线下电商使用」）；`allowed_dimensions` ×0（全模板无「显式枚举可加维度」的 definition）。
- **全字段留空指标**（caliber 与 aggregation 均空）：**6**——traffic、new_store_sales、purchase_inbound_value、outbound_orders、total_profit、dealership_gross_profit。
- **多值 caliber_type**：**14** 个——gmv、terminal_sales、paid_amount、o2o_sales、new_store_count、closed_store_count、inventory_value、cumulative_retail_value、net_allocation_value、inventory_turnover_days、coverage_rate、delivery_achievement_rate、launch_achievement_rate、operating_revenue（均为退款+范围/锚点等真实跨族并存，非单族可覆盖）。
- 族分布（总赋值 63 = 35 单值 + 14×2 多值）：refund_adjustment ×18、scope_inclusion ×17、measurement_anchor ×15、validity_threshold ×7、fee_composition ×6、attribution_window ×0、proration_rule ×0、cap_anomaly_rule ×0（后三族在服饰 72 指标 definition 中无依据，按宁缺毋滥全留空）。

## Controller 裁决留档（REVIEW#1 后）

- **gmv「仅支持店铺维度」**：裁决——不构成 Q2 规则②的「显式排除」适用面。该句是数据粒度支持声明，非维度排除语义；维持留空。后续 6 模板回填同口径执行：粒度支持声明 ≠ disallowed_dimensions。
- **measurement_anchor 尺度**：裁决——采纳工人基准：仅非默认锚（事件对时长/期末时点/累计窗/特殊确认时点）赋值；常规「按支付时间统计」类默认约定不赋值。该基准作为后续模板回填 SOP。
