# 第一阶段-A 买家商品闭环功能完成度审计

项目路径：`D:\github\wechat-miniprogram`

审计范围：
- 商城列表
- 商品详情
- 加入购物车
- 立即购买
- 购物车管理
- 地址列表
- 新增/编辑地址
- 确认订单
- 提交订单
- mock 支付
- 商品订单详情
- 商品订单列表
- 与原活动订单链路的隔离/兼容

说明：
- 本报告基于当前仓库代码静态审计，不含真实小程序端到端联调结果
- 本次不改代码，只判断“是否已真正形成闭环”

---

## 一、总体结论

### 1. 已基本形成闭环的能力
- 商品详情页可发起“加入购物车”
- 商品详情页可发起“立即购买”
- 购物车可加载、改数量、删除、勾选
- 确认订单页可预览订单、拉取默认地址、提交订单
- 提交订单可创建 `productOrders` 记录
- mock 支付链路可把订单从 `pending_payment` 更新为 `paid`
- 商品订单详情页可加载并展示订单数据
- 商品订单列表页可加载并展示商品订单
- 商品链路与原活动订单链路已做页面隔离，没有直接把原活动订单页改成商品订单页

### 2. 目前仍是“部分完成”的地方
- 商城列表已能展示商品，但仍偏基础列表，不是完整商城能力
- 商品订单列表页已存在，但缺少稳定的用户入口
- `confirmReceive` 前后端都有，但当前第一阶段-A内没有“发货”链路，因此正常业务下几乎无法走到 `shipped -> completed`
- `productCart.clearChecked` 云函数已存在，但前端未接入口

### 3. 当前最关键的现实判断
- “买家商品闭环”主链路已经不是空壳，代码层面已经能跑出一条最短链路
- 但它还没有达到“可交付完成”的稳态，主要差在：
  - 商品订单入口弱
  - 购物车与订单页的部分细节体验未补齐
  - 收货完成状态链路在第一阶段-A内并不完整

---

## 二、功能模块清单与完成度

| 模块 | 当前完成度 | 结论 |
|---|---|---|
| 商城列表 `mall` | 部分完成 | 有列表、有跳详情，但能力较基础 |
| 商品详情 `productDetail` | 已完成 | 展示、加购、立即购买已接通 |
| 加入购物车 | 已完成 | 前端与 `productCart.add` 已接通 |
| 立即购买 | 已完成 | 前端与 `confirmOrder` 已接通 |
| 购物车管理 `cart` | 已完成 | 列表、勾选、改数量、删除、去结算已接通 |
| 地址列表 `addressList` | 已完成 | 加载、选择、设默认、删除、编辑入口已接通 |
| 地址编辑 `addressEdit` | 已完成 | 新增/编辑保存已接通 |
| 确认订单 `confirmOrder` | 已完成 | 预览、默认地址、备注、建单、支付入口已接通 |
| 提交订单 | 已完成 | `productOrder.create` 已真正写订单、锁库存 |
| mock 支付 | 已完成 | `createPayment` + 前端模拟确认已接通 |
| 商品订单详情 `productOrderDetail` | 部分完成 | 展示、取消、继续支付可用；确认收货逻辑存在但上游状态缺口 |
| 商品订单列表 `productOrderList` | 部分完成 | 列表可用，但用户入口不足 |
| 活动订单兼容 | 已完成 | 原 `myOrders` 仍导向活动订单链路，未被商品订单硬替换 |

---

## 三、逐模块详细审计

## 1. 商城列表 `miniprogram/pages/mall/`

### 已完成
- [mall.js](/D:/github/wechat-miniprogram/miniprogram/pages/mall/mall.js) 能直接从 `products` 集合加载商品
- [mall.wxml](/D:/github/wechat-miniprogram/miniprogram/pages/mall/mall.wxml) 已绑定商品卡点击事件
- 点击商品卡可跳到 [productDetail.js](/D:/github/wechat-miniprogram/miniprogram/pages/productDetail/productDetail.js)

### 部分完成
- 当前仅是基础商品列表，没有筛选、排序、搜索、空态细化
- 页面会展示所有查到的商品，前端没有主动过滤 `isPurchasable=false` 的商品，只是详情页再拦截下单

### 缺什么
- 更明确的可售/不可售商品展示策略
- 用户级商城入口体验仍较基础

### 结论
- 不是空壳，能作为商品详情入口
- 但只能算“基础商城列表”

---

## 2. 商品详情 `miniprogram/pages/productDetail/`

### 已完成
- [productDetail.js](/D:/github/wechat-miniprogram/miniprogram/pages/productDetail/productDetail.js) 能从 `products` 集合读取详情
- 详情页支持图集预览、价格/库存/标签展示
- “加入购物车”已接到 `wx.cloud.callFunction({ name: 'productCart', action: 'add' })`
- “立即购买”已接到 `/pages/confirmOrder/confirmOrder?source=buy_now...`
- 不可售商品会被 `detail.isPurchasable` 拦截，按钮禁用并提示

### 缺什么
- 没有规格/SKU，这符合当前第一阶段-A最小闭环范围
- 没有营销能力，不属于当前阶段缺陷

### 结论
- 当前阶段内可视为已完成

---

## 3. 加入购物车

### 已完成
- 商品详情页的 `addToCart()` 已接通 [cloudfunctions/productCart/index.js](/D:/github/wechat-miniprogram/cloudfunctions/productCart/index.js)
- `productCart.add` 已校验：
  - 用户是否存在
  - 商品是否存在
  - 商品是否可售
  - 库存是否足够
- 已支持“同商品重复加入时累加数量”

### 闭环判断
- “从商品详情加入购物车”这一条已经是真闭环，不是骨架

### 结论
- 已完成

---

## 4. 立即购买

### 已完成
- 商品详情页 `handleBuy()` 会跳转到确认订单页并带上：
  - `source=buy_now`
  - `productId`
  - `quantity`
- 确认订单页会据此调用 `productOrder.preview`

### 闭环判断
- “从立即购买去确认订单”已经接通

### 结论
- 已完成

---

## 5. 购物车管理 `miniprogram/pages/cart/`

### 已完成
- [cart.js](/D:/github/wechat-miniprogram/miniprogram/pages/cart/cart.js) 会在 `onShow` 调 `productCart.list`
- 页面支持：
  - 勾选/取消勾选
  - 数量增减
  - 删除商品
  - 统计已选件数与金额
  - 去结算
- [cart.wxml](/D:/github/wechat-miniprogram/miniprogram/pages/cart/cart.wxml) 视图层已与这些事件绑定
- 有“跨商家不可合并结算”的校验

### 部分完成
- 前端没有接“清空已选”，虽然云函数里有 `clearChecked`
- 商品失效展示较基础，只显示“暂不可结算”

### 闭环判断
- “从购物车去结算”已成立
- 对于 `source=cart`，确认订单页不传 `cartItemIds`，而是依赖云端读取当前用户所有 `selected=true` 项，这条逻辑是能工作的

### 结论
- 主能力已完成
- 细节能力部分完成

---

## 6. 地址列表 `miniprogram/pages/addressList/`

### 已完成
- [addressList.js](/D:/github/wechat-miniprogram/miniprogram/pages/addressList/addressList.js) 已接 `addressManage.list`
- 支持：
  - 地址加载
  - 选择地址回传给确认订单页
  - 设为默认
  - 编辑
  - 删除
- [addressList.wxml](/D:/github/wechat-miniprogram/miniprogram/pages/addressList/addressList.wxml) 已绑定对应操作

### 结论
- 已完成

---

## 7. 新增/编辑地址 `miniprogram/pages/addressEdit/`

### 已完成
- [addressEdit.js](/D:/github/wechat-miniprogram/miniprogram/pages/addressEdit/addressEdit.js) 已支持：
  - 新增地址 `create`
  - 编辑地址 `detail + update`
  - 默认地址切换
- [cloudfunctions/addressManage/index.js](/D:/github/wechat-miniprogram/cloudfunctions/addressManage/index.js) 已提供：
  - `list`
  - `detail`
  - `create`
  - `update`
  - `delete`
  - `setDefault`

### 部分完成
- 地址编辑目前是纯文本输入，没有地区选择器/地图选点
- 这不是第一阶段-A阻塞项

### 结论
- 第一阶段-A范围内已完成

---

## 8. 确认订单 `miniprogram/pages/confirmOrder/`

### 已完成
- [confirmOrder.js](/D:/github/wechat-miniprogram/miniprogram/pages/confirmOrder/confirmOrder.js) 已支持两种来源：
  - `buy_now`
  - `cart`
- 会调用 `productOrder.preview`
- 会优先带入默认地址或用户选中的地址
- 支持填写备注
- 点击“提交并支付”会：
  1. 调 `productOrder.create`
  2. 调 `runProductOrderPayment`
  3. 最后 `redirectTo` 商品订单详情页

### 闭环判断
- “确认订单拉取默认地址”已成立
- “提交订单生成订单记录”已成立
- “下单后不再 navigateBack”已落实

### 结论
- 已完成

---

## 9. 提交订单 / 订单创建 `cloudfunctions/productOrder -> create`

### 已完成
- [cloudfunctions/productOrder/index.js](/D:/github/wechat-miniprogram/cloudfunctions/productOrder/index.js) 的 `create` 已真正执行建单事务
- 建单时已完成：
  - 地址归属校验
  - 商品再次校验
  - 单商家约束
  - 库存锁定：`stock - quantity`
  - 锁定库存：`lockedStock + quantity`
  - 购物车来源时删除对应购物车项
  - 创建 `productOrders` 记录

### 结论
- 已完成

---

## 10. mock 支付

### 已完成
- [miniprogram/utils/commerce.js](/D:/github/wechat-miniprogram/miniprogram/utils/commerce.js) 中 `runProductOrderPayment()` 已形成 mock 支付适配层
- 流程是：
  1. 先调 `productOrder.createPayment`
  2. 弹出“模拟支付”确认框
  3. 用户确认后再次调 `productOrder.createPayment` 并带 `confirmMock`
- [cloudfunctions/productOrder/index.js](/D:/github/wechat-miniprogram/cloudfunctions/productOrder/index.js) 的 `createPayment` 已支持：
  - 待支付校验
  - 过期校验
  - mock 支付成功后把订单改为 `paid`
  - 把 `lockedStock` 转为 `soldCount`

### 闭环判断
- “mock 支付后更新订单状态”已成立

### 结论
- 已完成

---

## 11. 商品订单详情 `miniprogram/pages/productOrderDetail/`

### 已完成
- [productOrderDetail.js](/D:/github/wechat-miniprogram/miniprogram/pages/productOrderDetail/productOrderDetail.js) 会调用 `productOrder.detail`
- [productOrderDetail.wxml](/D:/github/wechat-miniprogram/miniprogram/pages/productOrderDetail/productOrderDetail.wxml) 已展示：
  - 状态
  - 倒计时
  - 订单号
  - 地址快照
  - 商品项
  - 金额
  - 物流信息
- 支持：
  - 取消订单
  - 继续支付
  - 查看商品订单列表

### 部分完成
- “确认收货”前后端代码都在，但当前第一阶段-A没有发货链路，也没有 `ship` action，因此正常情况下订单不会自然进入 `shipped`
- 物流展示位存在，但第一阶段-A没有人会写入 `delivery.company/trackingNo`

### 结论
- 页面不是空壳
- 但其中“确认收货”与“物流信息”在当前阶段仍属半闭环

---

## 12. 商品订单列表 `miniprogram/pages/productOrderList/`

### 已完成
- [productOrderList.js](/D:/github/wechat-miniprogram/miniprogram/pages/productOrderList/productOrderList.js) 已接 `productOrder.listMine`
- 支持按状态切换：
  - `all`
  - `pending_payment`
  - `paid`
  - `shipped`
  - `completed`
  - `cancelled`
  - `closed`
- 可跳转到订单详情

### 部分完成
- 当前缺少明显的稳定入口
  - [myOrders.js](/D:/github/wechat-miniprogram/miniprogram/pages/myOrders/myOrders.js) 仍导向活动订单链路
  - 商品订单列表目前主要通过商品订单详情页里的“查看商品订单”进入
- 列表页没有直接提供支付/取消等快捷操作，只能进详情页操作

### 闭环判断
- “订单列表能正确展示”从代码上看是成立的
- 但“用户如何自然进入订单列表”这件事仍不完善

### 结论
- 功能已接通
- 用户入口部分完成

---

## 13. 云函数：`cloudfunctions/productCart/`

### 已完成
- 目录和逻辑都存在，不是空目录
- 已实现：
  - `list`
  - `add`
  - `updateQty`
  - `toggleSelect`
  - `remove`
  - `clearChecked`
- 已带最小商品回填逻辑：
  - 价格统一转分
  - 商家字段默认值
  - 库存默认值
  - 状态默认值

### 有云函数但前端未接好的部分
- `clearChecked` 前端没有入口

### 结论
- 云函数主体已完成

---

## 14. 云函数：`cloudfunctions/addressManage/`

### 已完成
- 目录和逻辑都存在，不是空目录
- 已实现：
  - `list`
  - `detail`
  - `create`
  - `update`
  - `delete`
  - `setDefault`
- 默认地址唯一性处理已做
- 删除默认地址后的补位已做

### 结论
- 已完成

---

## 15. 云函数：`cloudfunctions/productOrder/`

### 已完成
- 目录和逻辑都存在，不是空目录
- 已实现：
  - `preview`
  - `create`
  - `detail`
  - `listMine`
  - `cancel`
  - `closeExpired`
  - `createPayment`
  - `confirmReceive`
- 已实现的关键业务：
  - 默认地址读取
  - 购物车选中项读取
  - 单商家校验
  - 分单位金额计算
  - 库存锁定
  - 取消回补库存
  - 超时自动关单并回补库存
  - mock 支付改状态

### 部分完成
- `confirmReceive` 仅在订单已经变成 `shipped` 时可用
- 当前第一阶段-A没有发货逻辑，因此这条状态链正常业务下走不到

### 结论
- 主体已完成
- 收货末端属于“代码有，链路未完全闭合”

---

## 四、关键闭环能力逐项判断

| 关键能力 | 当前判断 | 说明 |
|---|---|---|
| 从商品详情加入购物车 | 已闭环 | `productDetail -> productCart.add -> cartItems` |
| 从购物车去结算 | 已闭环 | `cart -> confirmOrder(source=cart)`，云端读取选中项 |
| 从立即购买去确认订单 | 已闭环 | `productDetail -> confirmOrder(source=buy_now)` |
| 确认订单拉取默认地址 | 已闭环 | `productOrder.preview -> getPreferredAddress` |
| 提交订单生成订单记录 | 已闭环 | `productOrder.create` 真正写入 `productOrders` |
| mock 支付后更新订单状态 | 已闭环 | `createPayment(confirmMock)` 会把订单改为 `paid` |
| 订单详情能正确展示 | 基本闭环 | 详情页数据字段齐全；物流/收货部分仍依赖后续状态 |
| 订单列表能正确展示 | 基本闭环 | 列表页可加载，但入口较弱 |

---

## 五、按问题类型归类

## 1. 已完成
- 商品详情展示
- 加入购物车
- 立即购买
- 购物车加载与基础管理
- 地址列表
- 新增地址
- 编辑地址
- 确认订单预览
- 提交订单建单
- mock 支付
- 商品订单详情基础展示
- 商品订单列表基础展示
- 商品与活动订单页面隔离

## 2. 部分完成
- 商城列表
- 购物车完整体验
- 商品订单详情完整状态闭环
- 商品订单列表入口设计
- 确认收货

## 3. 未完成
- 第一阶段-A范围内，严格说“完全未做”的核心买家模块不多
- 但下列业务能力尚未闭合：
  - 发货链路
  - 正常可达的收货链路
  - 商品订单的稳定主入口

## 4. 有页面但缺逻辑
- `productOrderDetail`
  - “确认收货”按钮的前后端逻辑存在，但缺上游发货状态支撑
- `productOrderList`
  - 页面可用，但缺主入口，不足以构成完整用户心智

## 5. 有前端但缺云函数支持
- 当前审计范围内，没有发现“前端页面存在但完全缺对应云函数”的情况

## 6. 有云函数但前端未接好
- `productCart.clearChecked`
  - 云函数已实现
  - 前端购物车页没有入口

---

## 六、对原活动订单链路的影响

### 目前兼容性较好的点
- [myOrders.js](/D:/github/wechat-miniprogram/miniprogram/pages/myOrders/myOrders.js) 仍旧导向 [myActivities.js](/D:/github/wechat-miniprogram/miniprogram/pages/myActivities/myActivities.js)
- 商品订单独立使用：
  - [productOrderList.js](/D:/github/wechat-miniprogram/miniprogram/pages/productOrderList/productOrderList.js)
  - [productOrderDetail.js](/D:/github/wechat-miniprogram/miniprogram/pages/productOrderDetail/productOrderDetail.js)
- 商品订单云函数独立使用 [cloudfunctions/productOrder/index.js](/D:/github/wechat-miniprogram/cloudfunctions/productOrder/index.js)
- 原活动订单云函数 [cloudfunctions/activityOrder/index.js](/D:/github/wechat-miniprogram/cloudfunctions/activityOrder/index.js) 没有被商品链路复用改写

### 仍需注意的地方
- “我的”页当前没有为商品订单提供明确入口，这虽然降低了对活动订单的冲击，但也让商品订单入口偏弱

### 结论
- 当前商品闭环对原活动订单链路的侵入较小
- 兼容优先做得比入口体验更充分

---

## 七、建议的实现优先级

### 优先级 P1：必须尽快补齐
1. 给商品订单列表增加稳定入口
2. 验证并补稳 `cart -> confirmOrder -> create -> mock pay -> detail -> list` 全链路
3. 补足商品订单详情页的状态可达性说明或入口策略

### 优先级 P2：建议补齐
4. 购物车页接上 `clearChecked` 或等价能力
5. 商城列表增加最小可售过滤或显式不可售展示

### 优先级 P3：后续阶段再补
6. 发货链路
7. 收货链路真正闭合
8. 更完整的订单入口体系

---

## 八、下一步最应该补的 5 个功能点

1. 为商品订单列表增加明确入口  
当前商品订单列表主要从订单详情页反跳进入，真实用户入口不足。

2. 把商品订单详情中的“确认收货”补成真正可达链路  
现在前后端代码都在，但第一阶段-A内没有发货动作，导致这个能力实际不可达。

3. 为购物车补“清空已选”或等价快捷能力  
对应云函数已有，但前端没接，属于低成本补全项。

4. 在商城列表里更清晰地区分可售与不可售商品  
现在详情页会拦，但商城页本身仍偏“都展示”，容易让用户多点一步才知道不能买。

5. 做一轮真实联调验证库存与订单状态  
尤其验证：
 - 建单时 `stock/lockedStock`
 - 取消时回补
 - 超时关闭时回补
 - mock 支付后转 `paid`

---

## 九、最终判断

当前仓库里的“第一阶段-A 买家商品闭环”不是只有页面骨架，主链路已经具备：

- 商品详情
- 加购
- 立即购买
- 购物车
- 地址
- 确认订单
- 建单
- mock 支付
- 商品订单详情
- 商品订单列表

但它还没有完全达到“功能完成可收口”的状态。最主要还差的是：

- 商品订单入口体系不完整
- 收货状态链不完整
- 购物车与商城页还有少量闭环细节未补

换句话说：  
**主链路已成型，细节和最后一段状态闭环还没彻底收完。**
