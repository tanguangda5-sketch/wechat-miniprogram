# Encoding Audit Report

## 1. 扫描概览

- 扫描范围：`miniprogram/`、`cloudfunctions/`
- 扫描文件类型：`.js`、`.json`、`.wxml`、`.wxss`、`.ts`、`.wxs`
- 扫描文件总数：`296`

## 2. 发现 BOM 的文件

以下文件在首次扫描时带有 UTF-8 BOM：

1. `cloudfunctions/seedProducts/index.js`
2. `miniprogram/pages/activityOrderDetail/activityOrderDetail.wxss`
3. `miniprogram/pages/activityReview/activityReview.wxss`
4. `miniprogram/pages/book/book.wxss`
5. `miniprogram/pages/detail/detail.wxss`
6. `miniprogram/pages/dnaTag/dnaTag.wxss`
7. `miniprogram/pages/home/home.js`
8. `miniprogram/pages/home/home.wxss`
9. `miniprogram/pages/hotel/hotel.wxss`
10. `miniprogram/pages/index/index.wxss`
11. `miniprogram/pages/mall/mall.wxss`
12. `miniprogram/pages/myActivities/myActivities.wxss`
13. `miniprogram/pages/order/order.wxss`
14. `miniprogram/pages/permissionSettings/permissionSettings.wxss`
15. `miniprogram/pages/qaCenter/qaCenter.wxss`
16. `miniprogram/pages/regionSelect/regionSelect.wxss`
17. `miniprogram/pages/reviewCenter/reviewCenter.wxss`
18. `miniprogram/pages/ruralFun/ruralFun.wxss`
19. `miniprogram/pages/search/search.js`
20. `miniprogram/pages/travelerEdit/travelerEdit.wxss`
21. `miniprogram/pages/travelerSelect/travelerSelect.wxss`
22. `miniprogram/pages/welcome/welcome.wxss`

## 3. 发现 `�` 或非法头字符的文件

- 发现 `�`（replacement character）文件数：`0`
- 发现文件头非法字符文件数：`22`
- 这 22 个文件与 BOM 文件完全重合，均由 UTF-8 BOM 导致
- 未发现额外的零宽字符、非法控制字符、非 UTF-8 文件

## 4. 已修复文件与修改类型

本次修复全部为**保守型编码修复**，未改业务逻辑。

| 文件 | 修改类型 |
| --- | --- |
| `cloudfunctions/seedProducts/index.js` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/activityOrderDetail/activityOrderDetail.wxss` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/activityReview/activityReview.wxss` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/book/book.wxss` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/detail/detail.wxss` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/dnaTag/dnaTag.wxss` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/home/home.js` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/home/home.wxss` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/hotel/hotel.wxss` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/index/index.wxss` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/mall/mall.wxss` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/myActivities/myActivities.wxss` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/order/order.wxss` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/permissionSettings/permissionSettings.wxss` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/qaCenter/qaCenter.wxss` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/regionSelect/regionSelect.wxss` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/reviewCenter/reviewCenter.wxss` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/ruralFun/ruralFun.wxss` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/search/search.js` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/travelerEdit/travelerEdit.wxss` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/travelerSelect/travelerSelect.wxss` | 仅去 BOM，保持 UTF-8 无 BOM |
| `miniprogram/pages/welcome/welcome.wxss` | 仅去 BOM，保持 UTF-8 无 BOM |

## 5. 复查结果

复查后结果如下：

- BOM 文件数：`0`
- `�` 文件数：`0`
- 文件头非法字符文件数：`0`
- 非 UTF-8 文件数：`0`
- JSON 语法错误文件数：`0`

## 6. 页面路径配置异常

- `app.json` 页面路径异常：`无`
- `confirmOrder`、`addressList`、`addressEdit`、`productOrderDetail`、`productOrderList` 四件套检查结果：`全部齐全`

## 7. 云函数引用缺失

- 基于 `miniprogram/` 中 `wx.cloud.callFunction` 的静态扫描结果：`未发现缺失的云函数目录`

## 8. 只报告不修改的问题

以下问题本次选择只报告、不修改：

1. 未对任何订单业务逻辑做调整  
   原因：本次任务限定为编码、格式、JSON、路径、引用层面的保守修复，避免影响商品订单链路和原活动订单链路。

2. 未修改 `app.json` 页面注册顺序与业务结构  
   原因：静态检查未发现页面路径缺失或四件套缺失，没有必要做结构性改动。

3. 未修改任何云函数入参/出参、状态流转、订单边界  
   原因：未发现因接口结构导致的编译阻塞问题，且此类修改风险高。

4. 未新增 `scripts/fix-encoding.js` 或 `scripts/check-miniapp-structure.js`  
   原因：当前本地环境缺少 Node.js 命令，已使用一次性审计脚本完成扫描、修复和复查；为避免额外引入不可执行脚本，本次未新增脚本文件。

5. 未执行微信开发者工具 CLI 编译  
   原因：当前环境未发现可用的微信开发者工具命令行入口，无法在仓库内直接发起实际编译；但已完成静态复查，编码、JSON、页面路径与云函数目录引用均未发现阻塞项。
