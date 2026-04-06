# 小程序前后端会话状态改造清单

## 1. 文档目标

这份清单只解决一件事：

把下面三层状态统一起来，避免主线和字段在不同层各跑各的。

- 小程序前端
- 腾讯云智能体 workflow
- 正式云端 Agent / 后端

目标是让四条主线都满足：

1. 当前主线明确
2. 当前任务字段明确
3. 缺什么字段明确
4. 追问哪一个字段明确
5. 本轮候选结果可追踪

---

## 2. 当前问题总结

从现在仓库结构看，已有这几类状态来源：

- 小程序 `contextPayload`
- 小程序页面本地 `messages / skillMode / genericPreferences`
- 云端 Agent 动态推断 `mainline`
- 技能入口里传入的 `skillContext`
- 用户长期画像 `userProfile`

当前风险点：

1. 主线识别有一部分在前端，一部分在后端。
2. 当前任务字段没有统一状态对象。
3. `skillContext.collected` 还不是稳定协议。
4. 前端知道自己在哪个技能页进入，但后端不一定拿到完整同构字段。
5. workflow 层如果后续接平台配置，字段名很容易和代码层分叉。

结论：

下一步不能再继续只改 prompt，必须先把状态协议固定。

---

## 3. 统一状态原则

## 3.1 一条原则

长期记忆和当前任务状态必须彻底分开。

长期记忆只管画像：

- 常驻城市
- 常用出发地
- 出行风格
- 偏好标签
- 大致预算区间

当前任务状态只管本次任务：

- 这次去哪
- 这次什么时候
- 这次找什么搭子
- 当前已收集到哪一步

## 3.2 三层职责

小程序前端负责：

- 页面入口来源
- 当前会话消息
- 当前轮输入
- 展示层状态
- 把上下文打包发给后端

平台 workflow 负责：

- 当前主线推进
- 字段收集状态
- 缺字段判断
- 节点分支决策

后端 Agent 负责：

- 主线兜底判断
- 数据召回
- 候选匹配
- 实时工具调用
- 最终 prompt 组织

---

## 4. 最终统一状态模型

建议统一成 3 个对象：

1. `contextPayload`
2. `sessionState`
3. `userProfileMemory`

## 4.1 contextPayload

用途：

- 每轮请求携带的输入上下文

建议结构：

```json
{
  "mode": "generic | skill",
  "source": "search_input | skill_entry | quick_action",
  "question": "",
  "location": {
    "province": "",
    "city": "",
    "district": "",
    "displayName": "",
    "locationText": "",
    "latitude": "",
    "longitude": ""
  },
  "userProfile": {
    "nickname": "",
    "dnaTags": [],
    "residentCity": "",
    "commonDeparture": "",
    "travelStyle": "",
    "budgetRange": ""
  },
  "preferences": {
    "distance": "",
    "budget": "",
    "detailLevel": ""
  },
  "skillContext": {
    "mode": "",
    "title": "",
    "collected": {}
  }
}
```

说明：

- `contextPayload` 不负责保存 workflow 中间态
- `skillContext.collected` 只承接本轮之前已经明确的任务字段
- 不能把所有历史推断都塞进去

## 4.2 sessionState

用途：

- workflow 当前执行状态

建议结构：

```json
{
  "mainline": "",
  "subType": "",
  "collected": {},
  "missingField": "",
  "lastAskedField": "",
  "candidateIds": [],
  "feedbackType": "",
  "intentConfidence": 0
}
```

说明：

- `collected` 只保存当前任务字段
- `missingField` 是当前轮最关键缺项
- `lastAskedField` 用于防止重复追问
- `candidateIds` 只记录本轮结果，不是长期数据

## 4.3 userProfileMemory

用途：

- 持久画像

建议字段：

```json
{
  "residentCity": "",
  "commonDeparture": "",
  "travelStyle": "",
  "preferenceTags": [],
  "budgetRange": ""
}
```

---

## 5. 各主线字段协议

## 5.1 找搭子

统一字段：

```json
{
  "departure": "",
  "destination": "",
  "time": "",
  "companionPreference": ""
}
```

要求：

- 前端和平台 workflow 都必须使用同名字段
- 后端不允许再起别名字段做第二套协议

## 5.2 攻略定制

统一字段：

```json
{
  "time": "",
  "peopleCount": "",
  "relationship": "",
  "budget": "",
  "destination": ""
}
```

## 5.3 天气 / 位置

统一字段：

```json
{
  "subType": "weather | location",
  "resolvedPlace": ""
}
```

## 5.4 树洞反馈

统一字段：

```json
{
  "feedbackType": "",
  "feedbackSummary": ""
}
```

---

## 6. 小程序前端改造清单

重点文件：

- [`askXiaoheChat.js`](/E:/三创赛/miniprogram/pages/askXiaoheChat/askXiaoheChat.js)

## 6.1 任务：统一构造 contextPayload

目标：

把当前页面散落的上下文统一收口到一个固定结构。

要做的事：

1. 固定 `mode`
2. 固定 `source`
3. 固定 `skillContext.mode`
4. 固定 `skillContext.title`
5. 固定 `skillContext.collected`
6. 不再由前端私自推导业务候选类型并抢先渲染主链路逻辑

说明：

前端可以保留 UI 辅助渲染，但不能代替业务主线判断。

## 6.2 任务：建立当前任务状态对象

建议页面内新增：

```json
{
  "currentTaskState": {
    "mainline": "",
    "collected": {},
    "missingField": "",
    "lastAskedField": ""
  }
}
```

用途：

- 便于页面恢复会话
- 便于多轮追问时保持一致

## 6.3 任务：技能入口传参协议固定

当前技能入口进入聊天页时，必须统一传：

- `skillMode`
- `source = skill_entry`

并在前端映射成：

```json
{
  "skillContext": {
    "mode": "buddy_matching | guide_customization | xiaohe_feedback",
    "title": "",
    "collected": {}
  }
}
```

## 6.4 任务：停止前端抢业务主线

当前前端有一部分“根据问题直接决定推荐类型并本地拼 UI”的逻辑。

建议改造：

1. 前端只负责展示
2. 主线判断交给后端 / 平台 workflow
3. 前端可以保留卡片展示能力，但不要自己决定这轮该不该推荐

原因：

- 否则会再次出现“前端一个判断，后端一个判断”的串场问题

## 6.5 任务：会话恢复时恢复任务态

恢复聊天记录时，不只恢复消息，还要恢复：

- `mainline`
- `collected`
- `missingField`
- `lastAskedField`

否则用户回来后会出现重复追问。

---

## 7. 腾讯云平台 workflow 改造清单

## 7.1 任务：建立统一 sessionState

平台 workflow 里必须建立统一状态容器：

```json
{
  "mainline": "",
  "subType": "",
  "collected": {},
  "missingField": "",
  "lastAskedField": "",
  "candidateIds": [],
  "feedbackType": ""
}
```

## 7.2 任务：每个节点只读写固定字段

例如：

- `BuddyFieldExtract` 只写 `collected`
- `BuddyFieldCheck` 只写 `missingField`
- `BuddyCandidateQuery` 只写 `candidateIds`

不要让每个节点随意写新的名字。

## 7.3 任务：字段不跨主线污染

例如：

- 找搭子主线的 `companionPreference`
- 不要在攻略主线里继续残留并参与决策

建议：

- 切换主线时，重置当前 `sessionState.collected`
- 只保留用户画像，不保留旧任务表单态

## 7.4 任务：单字段追问规则固化

每条主线都必须：

1. 只追问 1 个字段
2. 把该字段写入 `missingField`
3. 把本轮追问字段写入 `lastAskedField`

这样后续如果用户答非所问，workflow 才能继续判断而不是乱跳。

---

## 8. 后端 Agent 改造清单

重点文件：

- [`index.js`](/E:/三创赛/cloudfunctions/agent-yuxiaohe-1grmumm967563411/src/index.js)
- [`utils.js`](/E:/三创赛/cloudfunctions/agent-yuxiaohe-1grmumm967563411/src/utils.js)
- [`direct-answer.js`](/E:/三创赛/cloudfunctions/agent-yuxiaohe-1grmumm967563411/src/direct-answer.js)

## 8.1 任务：正式读取固定字段协议

后端必须只认这两套主线字段：

找搭子：

- `departure`
- `destination`
- `time`
- `companionPreference`

攻略定制：

- `time`
- `peopleCount`
- `relationship`
- `budget`
- `destination`

不建议继续扩展同义别名字段。

## 8.2 任务：统一输出 workflowContext

后端在进入 prompt 组装前，统一输出：

```json
{
  "mainline": "",
  "isReady": false,
  "fields": {},
  "missingField": null,
  "buddyCandidates": [],
  "feedbackType": ""
}
```

这样平台层和代码层结构一致。

## 8.3 任务：主线切换时重置任务态

例如：

- 用户刚刚在找搭子
- 下一句改成问天气

要求：

- 切到天气主线时，不再带着搭子字段继续跑

建议：

- 主线变化时，重置 `sessionState.collected`
- 但保留 `userProfile`

## 8.4 任务：候选结果只保留本轮引用 ID

不要把整份候选对象长期塞进会话态。

建议：

- `sessionState.candidateIds` 保留 ID 列表
- 真正展示时再从后端结果或本轮响应取详细内容

原因：

- 降低上下文污染
- 避免候选过期

---

## 9. 推荐开发顺序

建议按这个顺序拆任务：

1. 固定 `contextPayload` 协议
2. 固定 `skillContext.collected` 字段表
3. 平台建立统一 `sessionState`
4. 后端只认统一字段协议
5. 前端停止抢主线判断
6. 会话恢复补齐任务态恢复

---

## 10. 建议拆成的开发任务单

### 任务 1：固定前端 contextPayload 协议

产出：

- 前端统一请求结构

### 任务 2：固定四条主线字段表

产出：

- 字段协议表

### 任务 3：平台 workflow 接入 sessionState

产出：

- 各节点统一读写字段

### 任务 4：后端主链路对齐字段协议

产出：

- 统一 workflowContext 输出

### 任务 5：去除前端业务主线抢答逻辑

产出：

- 前端只负责 UI 展示

### 任务 6：补齐会话恢复机制

产出：

- 恢复消息 + 恢复任务态

---

## 11. 下一步最值得直接做的事

如果继续推进，最适合立刻做的是：

1. 我直接帮你把“字段协议表”写成开发可用的 JSON / TS 常量草案
2. 或者我直接开始改 [`askXiaoheChat.js`](/E:/三创赛/miniprogram/pages/askXiaoheChat/askXiaoheChat.js)，把前端 `contextPayload` 和任务态先收口

如果你要快速见效，我更建议下一步直接开始第 2 个，也就是先改前端聊天页的状态协议。
