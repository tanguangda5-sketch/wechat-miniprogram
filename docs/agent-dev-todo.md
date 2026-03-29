# 裕小禾 Agent 实际开发待办清单

这份清单用于把 [`docs/agent-integration-plan.md`](/e:/三创赛/docs/agent-integration-plan.md) 里的方案，拆成可以逐步执行的开发任务。

## 1. 命名与文案基线

- [ ] 确认全项目统一命名规范
- [ ] 页面入口文案统一为 `问小禾`
- [ ] Agent 正式名称统一为 `裕小禾`
- [ ] 对话自称、引导语、提示语统一使用 `小禾`
- [ ] 排查现有页面、云函数、文档里是否存在混用

验收标准：

- 页面入口不把 `裕小禾` 当按钮文案
- 对话提示不把 `问小禾` 当角色名
- 配置和 Prompt 不把 `小禾` 当正式 Agent 名称

## 2. 官方 Agent 控制台准备

- [ ] 在微信云开发控制台创建正式 Agent
- [ ] 将 Agent 名称设置为 `裕小禾`
- [ ] 配置首页展示/外部识别名称时，按需要保留 `问小禾` 作为页面入口文案，而不是 Agent 正式名
- [ ] 保存真实 `Agent ID / botId`
- [ ] 确认后续是否采用官方 Agent API 直连，还是 Agent UI 组件方案

验收标准：

- 已拿到可用的真实 `botId`
- 已确认接入路径：`官方 API` 或 `Agent UI`

## 3. 小程序基础环境检查

- [ ] 检查微信开发者工具版本
- [ ] 检查小程序基础库版本是否满足官方 Agent 接入要求
- [ ] 升级 [`project.config.json`](/e:/三创赛/project.config.json) 相关配置到可支持官方 Agent 的版本基线
- [ ] 确认云开发环境 ID 使用正确

验收标准：

- 基础库版本满足官方 Agent 能力要求
- 小程序本地预览和云开发初始化正常

## 4. Prompt 配置模块设计

- [ ] 新建 Agent Prompt 配置目录
- [ ] 拆分 `basePersonaPrompt`
- [ ] 拆分 `outputSchemaPrompt`
- [ ] 拆分 `genericPrompt`
- [ ] 拆分 `routePlanningPrompt`
- [ ] 拆分 `guideCustomizationPrompt`
- [ ] 拆分 `xiaoheFeedbackPrompt`
- [ ] 确定 Prompt 组装方式，避免写成一个超长字符串

建议目录：

- [ ] `cloudfunctions/<agent云函数>/prompts/basePersonaPrompt.js`
- [ ] `cloudfunctions/<agent云函数>/prompts/outputSchemaPrompt.js`
- [ ] `cloudfunctions/<agent云函数>/prompts/genericPrompt.js`
- [ ] `cloudfunctions/<agent云函数>/prompts/routePlanningPrompt.js`
- [ ] `cloudfunctions/<agent云函数>/prompts/guideCustomizationPrompt.js`
- [ ] `cloudfunctions/<agent云函数>/prompts/xiaoheFeedbackPrompt.js`

验收标准：

- Prompt 已按职责拆分
- 支持按模式动态拼装

## 5. 变量映射层设计

- [ ] 统一 `question` 的输入来源
- [ ] 统一 `location` 的文本化规则
- [ ] 统一 `userProfile` 的字段来源
- [ ] 统一 `preferences` 的字段来源
- [ ] 统一 `candidates` 的数据结构
- [ ] 统一路线规划表单字段映射
- [ ] 统一攻略定制表单字段映射
- [ ] 统一小禾树洞字段映射

建议输出映射对象至少覆盖：

- [ ] `question`
- [ ] `location`
- [ ] `userProfile`
- [ ] `preferences`
- [ ] `candidates`
- [ ] `origin`
- [ ] `destination`
- [ ] `waypoints`
- [ ] `travelTime`
- [ ] `transportPreference`
- [ ] `peopleCount`
- [ ] `groupType`
- [ ] `days`
- [ ] `region`
- [ ] `budget`
- [ ] `transport`
- [ ] `feedbackType`
- [ ] `feedbackText`
- [ ] `recentContext`

验收标准：

- Agent 输入不直接拼页面原始数据
- 变量名统一、可复用、可测试

## 6. 候选数据筛选层

- [ ] 设计候选活动筛选逻辑
- [ ] 设计候选商品筛选逻辑
- [ ] 设计候选景点筛选逻辑
- [ ] 预留候选住宿筛选逻辑
- [ ] 统一候选卡片结构
- [ ] 限制候选数量，避免上下文过大

优先数据集合：

- [ ] `activities`
- [ ] `products`
- [ ] `scenics`
- [ ] `hotels`（如后续启用）

验收标准：

- Agent 接收的是“筛过一轮”的候选，不是全量数据库
- 平台内推荐内容有可控来源

## 7. Agent 调用层设计

- [ ] 确定是页面直连 Agent 还是通过云函数代理调用
- [ ] 定义统一的 Agent 调用入口
- [ ] 支持按模式传入不同 Prompt
- [ ] 支持传入候选数据和用户上下文
- [ ] 统一解析 Agent 返回 JSON
- [ ] 对返回缺字段、格式错误、超时等情况做兜底

建议能力：

- [ ] `generic`
- [ ] `route_planning`
- [ ] `guide_customization`
- [ ] `xiaohe_feedback`

验收标准：

- 调用层能稳定拿到结构化 JSON
- 返回异常时页面仍可展示兜底消息

## 8. 问小禾页面接入

- [ ] 确认正式入口页面是否沿用 [`miniprogram/pages/askXiaoheChat/askXiaoheChat.js`](/e:/三创赛/miniprogram/pages/askXiaoheChat/askXiaoheChat.js)
- [ ] 确认 [`miniprogram/pages/askXiaohe/askXiaohe.js`](/e:/三创赛/miniprogram/pages/askXiaohe/askXiaohe.js) 是否保留为入口过渡页
- [ ] 把现有 `xiaoheChat` 调用替换为官方 Agent 调用方案
- [ ] 页面上统一使用 `问小禾` 作为入口展示
- [ ] 对话引导语统一改成 `小禾`
- [ ] 支持渲染 `answer`
- [ ] 支持渲染 `cards`
- [ ] 支持渲染 `tips`
- [ ] 支持渲染 `guessQuestions`
- [ ] 支持渲染 `followUp`

验收标准：

- 用户从 `问小禾` 入口进入
- 页面里能看到 `小禾` 风格的回复
- 能展示结构化推荐结果

## 9. 四类模式逐步落地

### 9.1 普通问答 generic

- [ ] 接入普通问答模式 Prompt
- [ ] 使用当前位置、用户画像、临时偏好、候选活动进行回答
- [ ] 输出自然问答和推荐卡片

### 9.2 路线规划 route_planning

- [ ] 整理出发地、目的地、途径地、时间、交通偏好
- [ ] 信息收集完成后调用 Agent
- [ ] 输出自然路线建议和沿线活动卡片

### 9.3 攻略定制 guide_customization

- [ ] 整理人数、组成、天数、地区、预算、交通、偏好
- [ ] 信息收集完成后调用 Agent
- [ ] 输出个性化方案摘要和推荐卡片

### 9.4 小禾树洞 xiaohe_feedback

- [ ] 整理反馈类型、反馈内容、近期上下文
- [ ] 调用 Agent 做真诚回应与归纳
- [ ] 默认 `cards` 返回空数组

验收标准：

- 四种模式都能返回统一结构
- 模式语气和任务边界清晰

## 10. 输出结构校验

- [ ] 校验 `answer` 必须存在
- [ ] 校验 `cards` 必须为数组
- [ ] 校验 `tips` 必须存在，没有则返回空字符串
- [ ] 校验 `guessQuestions` 必须为数组
- [ ] 校验 `followUp` 必须存在，没有则返回空字符串
- [ ] 限制 `cards` 最多 3 条
- [ ] 限制 `guessQuestions` 数量合理

验收标准：

- 页面层永远拿到完整结构
- 不因为 Agent 少字段导致前端渲染报错

## 11. 旧能力迁移与清理

- [ ] 评估 [`cloudfunctions/xiaoheChat/index.js`](/e:/三创赛/cloudfunctions/xiaoheChat/index.js) 是否保留为候选筛选层或兜底逻辑
- [ ] 评估旧的自定义推荐文本逻辑是否下线
- [ ] 评估示例页中的 Agent demo 是否保留
- [ ] 清理与正式方案无关的占位说明或误导性文案

重点对象：

- [ ] [`cloudfunctions/xiaoheChat/index.js`](/e:/三创赛/cloudfunctions/xiaoheChat/index.js)
- [ ] [`miniprogram/pages/example/index.js`](/e:/三创赛/miniprogram/pages/example/index.js)
- [ ] [`miniprogram/pages/example/index.wxml`](/e:/三创赛/miniprogram/pages/example/index.wxml)

验收标准：

- 正式方案和 demo/旧逻辑边界清晰
- 用户不会进入未完成的示例链路

## 12. 文案统一排查

- [ ] 搜索全项目中的 `裕小禾`
- [ ] 搜索全项目中的 `小禾`
- [ ] 搜索全项目中的 `问小禾`
- [ ] 确认三者使用场景是否符合规范
- [ ] 补齐搜索栏提示、按钮文案、错误提示、空态文案

重点检查：

- [ ] 搜索栏提示
- [ ] 页面标题
- [ ] 对话欢迎语
- [ ] 加载失败提示
- [ ] 技能引导语

验收标准：

- 三套命名各司其职
- 没有明显混用

## 13. 测试与验收

### 13.1 功能测试

- [ ] 普通问答能正常返回
- [ ] 路线规划能正常收集信息并生成结果
- [ ] 攻略定制能正常收集信息并生成结果
- [ ] 小禾树洞能正常回应与归纳
- [ ] 卡片点击跳转正确

### 13.2 数据测试

- [ ] 候选活动为空时能正常兜底
- [ ] 用户位置为空时能正常兜底
- [ ] 用户画像为空时能正常兜底
- [ ] 返回 JSON 缺字段时能正常兜底

### 13.3 文案测试

- [ ] 入口显示 `问小禾`
- [ ] 对话里使用 `小禾`
- [ ] 不把 `问小禾` 当作角色名
- [ ] 不把 `裕小禾` 当作口语化引导词

## 14. 推荐执行顺序

建议按以下顺序实际推进：

1. [ ] 固化命名规范和方案文档
2. [ ] 创建正式 `裕小禾` Agent 并拿到 `botId`
3. [ ] 升级基础环境，满足官方 Agent 接入要求
4. [ ] 设计 Prompt 模块和变量映射层
5. [ ] 设计候选筛选层
6. [ ] 打通官方 Agent 调用
7. [ ] 升级 `问小禾` 页面
8. [ ] 分模式落地 `generic / route_planning / guide_customization / xiaohe_feedback`
9. [ ] 做文案排查与旧逻辑清理
10. [ ] 完成测试验收

---

这份清单建议作为后续开发执行稿使用。进入正式开发阶段时，可以按模块把每一节继续拆成 issue、任务卡或提交计划。
