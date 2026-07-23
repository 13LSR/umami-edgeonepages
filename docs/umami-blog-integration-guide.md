# Umami 博客接入指南

本文根据当前项目代码整理，适用于部署在 EdgeOne Pages、使用 Supabase PostgreSQL 的 Umami 实例，并覆盖普通 HTML、Hexo、Hugo、Astro、Vue、React 和 Next.js 博客。

示例 Umami 地址统一使用：

~~~text
https://analytics.example.com
~~~

请替换成你的 EdgeOne Pages 域名或自定义域名。

## 1. 接入前准备

### 1.1 确认 Umami 正常运行

先打开 Umami 管理后台并确认可以登录。第一次数据库迁移会创建默认管理员账号：

- 用户名：`admin`
- 密码：`umami`

首次登录后请立即修改默认密码。

### 1.2 创建网站并取得 Website ID

登录后台后进入 **Settings / 设置 → Websites / 网站 → Add website / 添加网站**，填写博客名称和域名并保存。保存后会得到一个 Website ID，通常是 UUID：

~~~text
8f7c2e4a-1234-4bcd-9876-abcdef012345
~~~

Website ID 不是登录账号、Supabase 项目 ID 或数据库名称；每个博客应使用独立的 Website ID。

## 2. 最小接入代码

当前项目默认生成的 Tracker 文件是 `script.js`，采集接口是 `/api/send`。在博客所有页面的公共 `<head>` 中加入：

~~~html
<script defer src="https://analytics.example.com/script.js" data-website-id="YOUR_WEBSITE_ID"></script>
~~~

说明：

- `src` 指向 Umami 实例的 `/script.js`。
- `data-website-id` 填写新建网站的 Website ID。
- `defer` 不会阻塞页面初始渲染。
- 不要把 `src` 写成 Supabase 地址。
- 不要把 Supabase 项目 ID 当成 Website ID。

## 3. 各类博客接入示例

### 3.1 普通 HTML

~~~html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>我的博客</title>
  <script defer src="https://analytics.example.com/script.js" data-website-id="YOUR_WEBSITE_ID"></script>
</head>
~~~

### 3.2 Astro

在公共布局，例如 `src/layouts/Layout.astro`：

~~~astro
---
const umamiUrl = 'https://analytics.example.com/script.js';
const websiteId = 'YOUR_WEBSITE_ID';
---

<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <script defer src={umamiUrl} data-website-id={websiteId}></script>
    <slot name="head" />
  </head>
  <body><slot /></body>
</html>
~~~

### 3.3 Next.js / React

使用 `next/script`，建议放在根布局：

~~~tsx
import Script from 'next/script';

export function UmamiScript() {
  return (
    <Script
      src="https://analytics.example.com/script.js"
      data-website-id="YOUR_WEBSITE_ID"
      strategy="afterInteractive"
    />
  );
}
~~~

也可以在 `app/layout.tsx` 中渲染这个组件。不要在每个页面重复插入脚本。

### 3.4 Vue / Vite

在项目根目录 `index.html` 的 `<head>` 中加入最简单：

~~~html
<script defer src="https://analytics.example.com/script.js" data-website-id="YOUR_WEBSITE_ID"></script>
~~~

### 3.5 Hexo

把代码放进主题的公共 head partial，例如：

~~~text
themes/<theme-name>/layout/_partial/head.ejs
themes/<theme-name>/layout/_layout.swig
themes/<theme-name>/layout/_layout.pug
~~~

以 EJS 为例：

~~~ejs
<script defer src="https://analytics.example.com/script.js" data-website-id="YOUR_WEBSITE_ID"></script>
~~~

### 3.6 Hugo

把代码放到主题公共 partial，例如 `layouts/partials/head.html`：

~~~html
<script defer src="https://analytics.example.com/script.js" data-website-id="YOUR_WEBSITE_ID"></script>
~~~

## 4. 自动统计内容

当前 Tracker 默认会收集：

- 页面浏览量
- 单页应用路由变化
- 页面标题、当前 URL 和来源页面
- 屏幕尺寸和浏览器语言
- 当前域名
- 浏览器、操作系统和设备等请求信息

Tracker 会监听 `history.pushState` 和 `history.replaceState`，常见的 React、Vue、Next.js 单页路由切换也会被统计。

## 5. 自定义事件

### 5.1 HTML 属性事件

给按钮或链接增加 `data-umami-event`：

~~~html
<button data-umami-event="signup-click">注册账号</button>
~~~

事件属性使用 `data-umami-event-` 前缀：

~~~html
<button
  data-umami-event="pricing-click"
  data-umami-event-plan="pro"
  data-umami-event-location="homepage"
>
  查看 Pro 方案
</button>
~~~

这会发送事件 `pricing-click`，数据包含 `plan=pro` 和 `location=homepage`。

### 5.2 JavaScript API

脚本加载后会提供 `window.umami`：

~~~html
<button id="download-button">下载 PDF</button>
<script>
  document.querySelector('#download-button').addEventListener('click', () => {
    window.umami?.track('download-pdf', {
      file: 'guide.pdf',
      location: 'article-bottom',
    });
  });
</script>
~~~

也可以传入完整对象：

~~~js
window.umami.track({
  name: 'newsletter-submit',
  data: { source: 'footer', category: 'technology' },
});
~~~

### 5.3 用户识别

`identify` 可以把后续行为关联到一个匿名标识：

~~~js
window.umami.identify('anonymous-user-123', {
  plan: 'pro',
  role: 'reader',
});
~~~

建议使用随机 ID 或内部匿名 ID，不要直接发送邮箱、手机号、姓名、身份证号、密码、Token 或订单完整内容。

## 6. 常用脚本属性

| 属性 | 示例 | 作用 |
| --- | --- | --- |
| `data-website-id` | `YOUR_WEBSITE_ID` | 必填，指定数据归属网站 |
| `data-host-url` | `https://analytics.example.com` | 指定 Umami 服务地址，跨域时可使用 |
| `data-auto-track` | `false` | 关闭自动页面统计 |
| `data-do-not-track` | `true` | 用户开启 DNT 时不发送 |
| `data-exclude-search` | `true` | 去掉 URL 查询参数 |
| `data-exclude-hash` | `true` | 去掉 URL hash |
| `data-domains` | `blog.example.com,www.blog.example.com` | 只允许指定域名 |
| `data-tag` | `production` | 为事件增加统一标签 |
| `data-fetch-credentials` | `include` | 设置请求凭据模式 |
| `data-before-send` | `filterAnalytics` | 发送前调用过滤函数 |

生产博客可以使用：

~~~html
<script
  defer
  src="https://analytics.example.com/script.js"
  data-website-id="YOUR_WEBSITE_ID"
  data-domains="blog.example.com,www.blog.example.com"
  data-exclude-search="true"
  data-exclude-hash="true"
></script>
~~~

## 7. 发送前过滤敏感字段

~~~html
<script>
  window.filterAnalytics = (type, payload) => {
    if (payload?.data) {
      const { internalNote, ...safeData } = payload.data;
      return { ...payload, data: safeData };
    }
    return payload;
  };
</script>
<script
  defer
  src="https://analytics.example.com/script.js"
  data-website-id="YOUR_WEBSITE_ID"
  data-before-send="filterAnalytics"
></script>
~~~

过滤函数返回 `null` 或 `undefined` 时，本次数据不会发送。真正的机密信息不要放入事件数据，不能只依赖前端过滤。

## 8. 当前项目的 EdgeOne 注意事项

### 8.1 Tracker 和采集地址

当前项目默认使用：

~~~text
https://你的-umami-域名/script.js
https://你的-umami-域名/api/send
~~~

EdgeOne 兼容版 Tracker 会把采集数据附加到请求查询参数中，以规避部分 EdgeOne 请求体读取问题。博客侧只需要加载 `script.js`，不要自行拼接 `/api/send`。

### 8.2 Umami 环境变量

| 变量 | 用途 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接串 |
| `APP_SECRET` | 建议设置固定的随机密钥 |
| `NEXT_PUBLIC_EDGE_COMPAT` | 前端 API 请求的 EdgeOne 兼容开关 |
| `TRACKER_SCRIPT_NAME` | 自定义 Tracker 文件名 |
| `TRACKER_SCRIPT_URL` | 将 Tracker 路径重写到外部地址 |
| `COLLECT_API_ENDPOINT` | 自定义采集接口路径 |
| `COLLECT_API_HOST` | 将采集请求发送到其他主机 |
| `PRIVATE_MODE` | 私有模式开关 |
| `DISABLE_BOT_CHECK` | 关闭机器人检测 |

### 8.3 EdgeOne 客户端 IP

在 EdgeOne Pages 上，建议配置：

~~~text
CLIENT_IP_HEADER=EO-Connecting-IP
~~~

EdgeOne 会通过 `EO-Connecting-IP` 提供客户端 IP。该变量让 Umami 优先使用 EdgeOne 的可信客户端 IP，避免使用变化的代理地址生成不同的 `sessionId`，从而导致同一个浏览器每次刷新都被统计成新访客。

配置步骤：

1. 打开 EdgeOne Pages 项目的环境变量设置。
2. 在 **Production** 环境新增变量，名称填写 `CLIENT_IP_HEADER`，值填写 `EO-Connecting-IP`。
3. 保存后重新部署项目。
4. 在同一个浏览器中连续刷新博客 3–5 次。
5. 检查 pageviews 每次增加、visitors 只增加一次，并确认短时间内 visits 不会每次刷新都增加。

这个修复只影响后续采集数据，已经产生的错误历史访客数据不会自动合并。

### 8.4 数据库连接与迁移

在 EdgeOne 控制台中，环境变量名称和值分开填写：

- 名称：`DATABASE_URL`
- 值：`postgresql://...`

值中不能再写 `DATABASE_URL=`。数据库密码中的 `#`、`@`、`/`、`:` 等特殊字符需要 URL 编码。

EdgeOne 默认 `pnpm run build` 只生成制品，不连接数据库。Supabase 数据库迁移应从能访问数据库的环境单独执行：

~~~bash
pnpm run update-db
~~~

### 8.5 跨域和 CSP

推荐博客和 Umami 都使用 HTTPS。若博客和 Umami 是不同域名：

- CSP 的 `script-src` 允许 Umami 域名。
- CSP 的 `connect-src` 允许 Umami 域名。
- 不要在 `data-host-url` 后重复拼接 `/api/send`。
- 使用 HTTPS，避免混合内容拦截。

## 9. 验证接入

### 9.1 浏览器 Network

1. 打开博客，按 `F12`。
2. 切换到 **Network**。
3. 刷新页面并搜索 `script.js`，确认状态为 `200`。
4. 搜索 `api/send`，确认不是 `404`、`403` 或 `500`。
5. EdgeOne 兼容版本可能把 `type` 和 `payload` 放在 URL 查询参数中，这是正常的。

### 9.2 Umami 控制台

1. 确认 Website ID 与脚本中的值一致。
2. 打开对应网站的实时数据页面。
3. 用新浏览器窗口访问博客。
4. 等待几秒到几十秒，观察访问量。

如果配置了 `data-domains`，当前访问域名必须在列表中。

### 9.3 手动测试事件

在浏览器控制台执行：

~~~js
window.umami?.track('manual-test', { source: 'browser-console' });
~~~

然后在 Network 中确认出现新的 `/api/send` 请求。

## 10. 常见问题

### `script.js` 返回 404

确认地址是：

~~~text
https://你的-umami-域名/script.js
~~~

如果设置了 `BASE_PATH`，需要把路径前缀加入 URL。

### `/api/send` 返回 400

常见原因：

- Website ID 错误或不是 UUID。
- 手动修改脚本后缺少 `type` 或 `payload`。
- 自定义事件数据不是普通 JSON。
- 事件名称、URL 或字段超过项目限制。

优先使用 Umami 后台生成的原始脚本，不要复制压缩后的 `public/script.js` 到博客。

### 没有统计数据

依次检查：

1. Website ID 是否正确。
2. `script.js` 是否返回 200。
3. `/api/send` 是否成功。
4. 当前域名是否被 `data-domains` 排除。
5. 浏览器是否启用 Do Not Track。
6. 是否设置了 `localStorage.umami.disabled`。
7. 广告拦截器或 CSP 是否拦截请求。

### 浏览器显示 `Unexpected end of JSON input`

这通常是前端收到空的 500 响应后解析失败。应查看 EdgeOne Log Analysis 中同一个请求的服务端错误，而不是只根据浏览器提示判断。登录问题重点检查 `/api/auth/login`，数据库问题重点检查 `DATABASE_URL` 和迁移状态。

### EdgeOne 返回 500

检查：

- Production 环境的 `DATABASE_URL` 没有 `DATABASE_URL=` 前缀。
- Supabase 密码已经更新并且只编码一次。
- 数据库迁移已经完成。
- 修改环境变量后重新部署。
- `APP_SECRET` 在不同部署版本中保持稳定。

## 11. 推荐最小模板

~~~html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>我的博客</title>
  <script
    defer
    src="https://analytics.example.com/script.js"
    data-website-id="YOUR_WEBSITE_ID"
    data-auto-track="true"
    data-exclude-search="true"
    data-exclude-hash="true"
  ></script>
</head>
~~~

## 12. 隐私和安全建议

- 不要把 `DATABASE_URL`、Supabase 密码或 `APP_SECRET` 放进博客前端。
- 不要把邮箱、手机号、姓名等个人信息直接作为事件属性发送。
- 使用 HTTPS。
- 生产环境建议限制 `data-domains`。
- 更换数据库密码后，同时更新本地迁移环境和 EdgeOne Production 环境变量。
- 修改环境变量后重新部署，旧部署不会自动读取新值。

## 13. 快速检查清单

- [ ] Umami 后台可以登录。
- [ ] 已创建对应博客网站。
- [ ] 已复制正确的 Website ID。
- [ ] 博客加载 Umami 域名下的 `script.js`。
- [ ] 脚本位于所有页面的公共布局中。
- [ ] `/api/send` 没有被 CSP、广告拦截器或域名限制阻止。
- [ ] Supabase 数据库已完成 Prisma migration。
- [ ] EdgeOne Production 的 `DATABASE_URL` 没有 `DATABASE_URL=` 前缀。
- [ ] 数据库密码特殊字符已经 URL 编码。
- [ ] 已在 Network 和 Umami 实时数据页面验证访问事件。
