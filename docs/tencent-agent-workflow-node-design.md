# 腾讯云智能体平台 Workflow 节点设计稿

## 1. 文档目标

这份文档把前面四条主线设计，进一步收敛成“腾讯云智能体平台可配置”的节点稿。

目标是明确：

- 每条主线需要哪些节点
- 每个节点输入什么
- 每个节点输出什么
- 哪些字段进入会话态
- 哪些字段来自 `contextPayload`
- 哪些节点需要调云函数
- 失败分支回什么文案

这份文档默认面向当前正式主链路：

- [`index.js`](/E:/三创赛/cloudfunctions/agent-yuxiaohe-1grmumm967563411/src/index.js)
- [`utils.js`](/E:/三创赛/cloudfunctions/agent-yuxiaohe-1grmumm967563411/src/utils.js)
- [`direct-answer.js`](/E:/三创赛/cloudfunctions/agent-yuxiaohe-1grmumm967563411/src/direct-answer.js)

---

## 2. 统一状态设计

## 2.1 contextPayload

建议 `contextPayload` 只承载“本轮输入上下文”和“外部注入信息”，不承载整条 workflow 的内部状态。

建议字段：

```json
{
  "mode": "generic | skill",
  "question": "用户本轮问题",
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
    "dnaTags": []
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

## 2.2 会话态 sessionState

建议 workflow 内部维护一份会话态，专门存当前任务状态。

建议字段：

```json
{
  "mainline": "",
  "subType": "",
  "collected": {},
  "missingField": "",
  "lastAskedField": "",
  "lastIntentConfidence": 0,
  "candidateIds": [],
  "feedbackType": ""
}
```

说明：

- `mainline`: 当前执行主线
- `subType`: 用于天气/位置这种子类型
- `collected`: 当前任务已收集字段
- `missingField`: 当前最关键缺失字段
- `lastAskedField`: 上一轮追问字段，避免重复问
- `candidateIds`: 当前候选结果 ID 列表
- `feedbackType`: 树洞反馈分类结果

## 2.3 长期记忆 memory

长期记忆只保留画像：

- 常驻城市
- 常用出发地
- 出行风格
- 偏好标签
- 大致预算区间

不进入长期记忆：

- 本次去哪
- 本次什么时间
- 本次找什么搭子
- 当前表单收集进度

---

## 3. 云函数与数据源映射

## 3.1 已有能力

- 搭子匹配：`cloudfunctions/userManage` 的 `getBuddyMatches`
- 平台候选召回：当前正式 Agent 已可从数据库读 `activities / scenics / hotels / products`
- 天气/位置：当前正式 Agent 已封装实时查询能力

## 3.2 建议职责划分

知识库：

- 业务规则
- 平台说明
- 角色设定
- FAQ
- 固定介绍

数据库 / 云函数：

- 搭子候选
- 用户资料
- DNA 标签
- 搭子偏好
- 实时天气
- 定位地区
- 平台实时活动 / 景点 / 商品 / 酒店内容

---

## 4. 总工作流总览

建议平台总流程先做一层总路由：

1. `MainlineIntentRouter`
2. 根据结果进入子 workflow：
   - `BuddyWorkflow`
   - `GuideWorkflow`
   - `WeatherLocationWorkflow`
   - `FeedbackWorkflow`
   - `GenericGuardWorkflow`

---

## 5. MainlineIntentRouter

## 5.1 节点目标

识别当前问题该走哪条主线。

## 5.2 输入

- `question`
- `contextPayload.skillContext.mode`
- `sessionState.mainline`

## 5.3 处理逻辑

优先级建议：

1. 如果来自显式技能入口，优先采用入口主线
2. 否则按意图关键词识别
3. 若不明确，进入 `GenericGuardWorkflow`

## 5.4 输出

```json
{
  "mainline": "buddy_matching | guide_customization | weather_location | xiaohe_feedback | generic_guard",
  "intentConfidence": 0.0
}
```

## 5.5 失败兜底

`我先不替你跳任务。你这次更想问天气、找搭子，还是做攻略？`

---

## 6. BuddyWorkflow

## 6.1 节点列表

1. `BuddyFieldExtract`
2. `BuddyFieldCheck`
3. `BuddySingleQuestion`
4. `BuddyCandidateQuery`
5. `BuddyResultCompose`
6. `BuddyFallback`

## 6.2 BuddyFieldExtract

目标：

提取 4 个字段：

- `departure`
- `destination`
- `time`
- `companionPreference`

输入：

- `question`
- `sessionState.collected`
- `contextPayload.location`
- 长期记忆中的常用出发地

输出：

```json
{
  "collected": {
    "departure": "",
    "destination": "",
    "time": "",
    "companionPreference": ""
  }
}
```

状态更新：

- 合并进 `sessionState.collected`

## 6.3 BuddyFieldCheck

目标：

判断缺哪个字段。

优先级：

1. `destination`
2. `time`
3. `departure`
4. `companionPreference`

输出：

```json
{
  "isReady": false,
  "missingField": "destination"
}
```

## 6.4 BuddySingleQuestion

触发条件：

- `isReady = false`

规则：

- 只问 1 个问题
- 不输出推荐

建议映射文案：

- `destination`: `你这次最想去哪里？`
- `time`: `你大概什么时候出发？`
- `departure`: `你这次准备从哪里出发？`
- `companionPreference`: `你更想找什么样的同行搭子？`

输出：

```json
{
  "answer": "单一追问",
  "cards": [],
  "tips": "",
  "guessQuestions": [],
  "followUp": ""
}
```

## 6.5 BuddyCandidateQuery

触发条件：

- `isReady = true`

调用：

- 云函数 `userManage`
- `action = getBuddyMatches`

请求参数建议：

```json
{
  "action": "getBuddyMatches",
  "payload": {
    "question": "{{question}}",
    "limit": 3
  }
}
```

输出：

```json
{
  "list": []
}
```

## 6.6 BuddyResultCompose

分支：

- 有候选
- 无候选

有候选输出要求：

- 候选卡片
- 每个候选的匹配理由
- 是否发起申请

无候选输出：

`当前没有合适候选。你可以补充一下时间、出发地或同行偏好，我再继续帮你缩小范围。`

## 6.7 BuddyFallback

适用场景：

- 云函数失败
- 候选解析失败
- 平台资源异常

建议文案：

- 服务失败：`现在搭子匹配服务暂时不可用，不是你表达有问题。你可以稍后再试。`
- 资源异常：`现在服务资源有点忙，找搭子这条链路暂时没跑通。你可以稍后再试一次。`

---

## 7. GuideWorkflow

## 7.1 节点列表

1. `GuideFieldExtract`
2. `GuideFieldCheck`
3. `GuideSingleQuestion`
4. `GuideCandidateRecall`
5. `GuidePlanCompose`
6. `GuideFallback`

## 7.2 GuideFieldExtract

提取字段：

- `time`
- `peopleCount`
- `relationship`
- `budget`
- `destination`

输入：

- `question`
- `sessionState.collected`
- `contextPayload.skillContext.collected`

输出：

```json
{
  "collected": {
    "time": "",
    "peopleCount": "",
    "relationship": "",
    "budget": "",
    "destination": ""
  }
}
```

## 7.3 GuideFieldCheck

缺字段优先级：

1. `destination`
2. `time`
3. `peopleCount`
4. `relationship`
5. `budget`

输出：

```json
{
  "isReady": false,
  "missingField": "time"
}
```

## 7.4 GuideSingleQuestion

触发条件：

- `isReady = false`

建议追问文案：

- `destination`: `你这次最想去哪里？`
- `time`: `你打算什么时候去？`
- `peopleCount`: `这次大概几个人一起？`
- `relationship`: `这次同行的人大概是什么关系？`
- `budget`: `这次预算大概想控制在什么范围？`

规则：

- 一次只问 1 个关键问题
- 不生成完整路线

## 7.5 GuideCandidateRecall

触发条件：

- `isReady = true`

调用方式建议：

- 不单独再建新云函数
- 先复用当前正式 Agent 的平台候选召回逻辑
- 平台里只需要把召回结果作为 prompt 输入

召回内容：

- `activities`
- `scenics`
- `hotels`
- `products`

过滤规则：

- 默认路线主体不引商品
- 只有用户明确要特产/伴手礼时，再引商品

## 7.6 GuidePlanCompose

输出要求：

- 路线建议
- 原因说明
- 下一步细化方向

解释至少覆盖两项：

- 时间
- 人数
- 关系
- 预算
- 目的地

候选不足时文案：

`按你现在给的信息，我先收到了一个大致方向，但当前平台候选还不够完整。你可以再补一下预算或人数，我继续帮你收窄。`

## 7.7 GuideFallback

建议文案：

- 服务失败：`现在攻略候选服务暂时不可用，不是你没说清楚。你可以稍后再试。`
- 资源异常：`现在服务资源有点忙，这次攻略链路没有正常跑通。你可以稍后再试一次。`

---

## 8. WeatherLocationWorkflow

## 8.1 节点列表

1. `WeatherLocationSubtypeDetect`
2. `WeatherQuery` / `LocationQuery`
3. `WeatherLocationCompose`
4. `WeatherLocationFallback`

## 8.2 WeatherLocationSubtypeDetect

目标：

区分天气还是位置。

输出：

```json
{
  "subType": "weather | location"
}
```

## 8.3 WeatherQuery / LocationQuery

调用来源：

- 复用当前正式 Agent 里的实时能力

输出：

- 成功结果
- 失败原因

## 8.4 WeatherLocationCompose

规则：

1. 成功则只输出天气/位置结果
2. 不扩成业务推荐
3. 不追加路线、搭子、商品

## 8.5 WeatherLocationFallback

建议文案：

- 天气服务失败：`实时天气暂不可用，刚才查询天气服务失败了。你可以稍后再试。`
- 地区不明确：`实时天气暂不可用，因为我还没能准确识别你要查询的地区。你可以直接说城市名。`
- 位置失败：`位置未获取成功。你可以先开启定位权限，或者直接告诉我你所在的城市。`

---

## 9. FeedbackWorkflow

## 9.1 节点列表

1. `FeedbackTypeClassify`
2. `FeedbackRespond`
3. `FeedbackSoftFollowUp`

## 9.2 FeedbackTypeClassify

输出：

```json
{
  "feedbackType": "product_feedback | emotion_support | platform_suggestion | experience_complaint"
}
```

## 9.3 FeedbackRespond

规则：

1. 先接住用户
2. 再回应内容
3. 不导购
4. 不跳业务主线

## 9.4 FeedbackSoftFollowUp

触发条件：

- 反馈太短
- 无法形成有效问题归因

规则：

- 一次只追问 1 个问题
- 问题尽量轻

建议文案：

- 一般反馈：`要是你愿意，可以再补一点具体场景，我会认真记下来。`
- 情绪倾诉：`你愿意的话，可以再告诉我刚刚最让你难受的点是什么。`
- 平台建议：`你要是愿意，可以再补一句你最希望它先改哪一处。`

---

## 10. GenericGuardWorkflow

## 10.1 节点列表

1. `AmbiguityCheck`
2. `IntentConfirm`
3. `GenericReply`

## 10.2 AmbiguityCheck

目标：

检查是否同时命中多个主线，或者意图不清。

输出：

```json
{
  "isAmbiguous": true,
  "possibleMainlines": ["buddy_matching", "guide_customization"]
}
```

## 10.3 IntentConfirm

触发条件：

- `isAmbiguous = true`

规则：

- 不自动跳任务
- 只问 1 个确认问题

建议文案：

- `你这次更想让我帮你找同行搭子，还是先帮你做出行攻略？`
- `你现在是想问天气，还是想让我按这个地方继续帮你安排内容？`

## 10.4 GenericReply

触发条件：

- 没有明确业务意图

规则：

- 正常回应
- 不调用业务推荐链路

---

## 11. 节点输入输出字段规范

建议平台内统一字段名，避免不同节点各起一套名字。

### 11.1 主线字段

```json
{
  "mainline": "",
  "subType": "",
  "intentConfidence": 0
}
```

### 11.2 收集字段

```json
{
  "collected": {},
  "missingField": "",
  "lastAskedField": ""
}
```

### 11.3 候选字段

```json
{
  "candidateIds": [],
  "candidates": []
}
```

### 11.4 反馈字段

```json
{
  "feedbackType": ""
}
```

---

## 12. 推荐平台配置顺序

建议你们在腾讯云智能体平台按这个顺序配置：

1. 先建总路由 `MainlineIntentRouter`
2. 先上线 `BuddyWorkflow`
3. 再上线 `GuideWorkflow`
4. 再补 `GenericGuardWorkflow`
5. 再补 `WeatherLocationWorkflow`
6. 最后补 `FeedbackWorkflow`

原因：

1. 搭子和攻略最影响业务结果
2. 防串场是稳定性护栏
3. 天气和树洞逻辑更短，后补成本更低

---

## 13. 下一步建议

如果继续往下做，最值得直接产出的就是两份：

1. 平台字段表最终版
2. 小程序前后端会话状态改造清单

这样你们就可以把：

- 平台 workflow
- 小程序 `contextPayload`
- 后端会话状态

三层一起对齐，不会出现“节点设计是一个版本、前端传参是另一个版本”的问题。
