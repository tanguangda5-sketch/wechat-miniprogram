# 媒体资源接入说明

当前项目的活动图片统一从 [mediaAssets.js](/e:/三创赛/miniprogram/utils/mediaAssets.js) 读取。

## 当前机制

- 活动卡片封面：`resolveActivityCover(activity)`
- 首页 banner：`resolveActivityBanner(activity)`
- 活动详情页轮播：`resolveActivityGallery(activity)`

这三个方法都支持以下 3 类资源地址：

- 本地路径：`/images/...`
- 网络地址：`https://...`
- 云存储文件 ID：`cloud://...`

当配置的是 `cloud://...` 时，页面会自动调用 `wx.cloud.getTempFileURL` 转成可渲染地址。

## 推荐做法

图片、视频、音频等大资源不要继续放在主包里，统一走：

- 腾讯云云存储 `cloud://...`
- 或 CDN / 对象存储 HTTPS 地址

## 活动资源维护位置

在 [mediaAssets.js](/e:/三创赛/miniprogram/utils/mediaAssets.js) 的 `ACTIVITY_MEDIA_MAP` 里维护每个活动：

- `cover`：活动封面
- `banner`：首页 banner 图，不填则默认用 `cover`
- `gallery`：活动详情页轮播图数组，不填则默认用 `[banner || cover]`

## 示例

```js
'lz-yuzhong-strawberry-family-day': {
  aliases: ['榆中', '草莓', '亲子'],
  cover: 'cloud://your-env-id/activity/covers/lz-yuzhong-strawberry-family-day.jpg',
  banner: 'https://cdn.example.com/activity/banner/lz-yuzhong-strawberry-family-day.jpg',
  gallery: [
    'cloud://your-env-id/activity/gallery/lz-yuzhong-strawberry-family-day-1.jpg',
    'cloud://your-env-id/activity/gallery/lz-yuzhong-strawberry-family-day-2.jpg',
  ],
}
```

## 注意

- 如果你改了这里的地址，不需要再把同一批大图放进 `miniprogram/images`。
- 如果你希望云端活动数据也一起写成新地址，需要重新部署并执行 [seedActivities](/e:/三创赛/cloudfunctions/seedActivities/index.js)。
