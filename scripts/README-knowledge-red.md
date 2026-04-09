# 红色文旅数据与图片脚本说明

## 文章入库
- 文章 payload：`scripts/data/knowledge_red_articles_payload.json`
- 写库脚本：`scripts/update-knowledge-red-articles.js`
- 默认是 `DRY_RUN=true`
- 仅当显式设置 `DRY_RUN=false` 时才会真正写入 `knowledgeArticles`
- 幂等匹配键：`seedKey`

PowerShell 示例：
- 试跑：`$env:DRY_RUN='true'; node scripts/update-knowledge-red-articles.js`
- 真写入：`$env:DRY_RUN='false'; node scripts/update-knowledge-red-articles.js`

## 图片上传
- 图片 manifest：`scripts/data/knowledge_red_image_manifest.json`
- 上传脚本：`scripts/upload-knowledge-red-images.js`
- 本地图片目录：`scripts/data/knowledge_red_images/<slug>/`
- 云存储路径：`knowledge/red/gansu/<slug>/cover.jpg`

上传脚本行为：
- 只会处理 `verifiedRealPhoto=true` 且 `aiGenerated=false` 且 `resolutionStatus != 'unresolved'` 的记录
- 若本地文件不存在，会输出 `missing-local`
- 上传成功后：
  - `cover` 角色会把 `knowledgeArticles.cover` 更新为云存储 `fileID`
  - 所有已上传记录都会写入 `imageMeta.uploadedAssets`

PowerShell 示例：
- 试跑：`$env:DRY_RUN='true'; node scripts/upload-knowledge-red-images.js`
- 真上传：`$env:DRY_RUN='false'; node scripts/upload-knowledge-red-images.js`

## 当前图片状态
- 已核验来源并可补图上传：哈达铺会议旧址、哈达铺站附图
- 仍需继续补图：会宁会师旧址、腊子口战役纪念地、高台烈士陵园、南梁革命纪念馆、甘肃红色线路总览
