# Product Roadmap Sync — Cloudflare Worker

把 admin 在浏览器里编辑的 roadmap 数据同步到 Cloudflare KV，让其他人下次打开页面就能看到最新版本。

## 一次性部署步骤

> 已经有 Cloudflare 账号；下面命令在 Mac Terminal 里跑。

### 1. 安装 wrangler

```bash
npm install -g wrangler
```

如果没有 npm：先装 Node.js（`brew install node`）。

### 2. 登录 Cloudflare

```bash
wrangler login
```

浏览器会跳出来让你授权，授权完关掉浏览器回到 Terminal。

### 3. 进入 worker 目录

```bash
cd /Users/mzy/Documents/Codex/2026-05-07/roadmap-e-c-p-u-cam/worker
```

### 4. 创建 KV namespace

```bash
wrangler kv:namespace create ROADMAP
```

输出会类似：

```
🌀 Creating namespace with title "product-roadmap-sync-ROADMAP"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
[[kv_namespaces]]
binding = "ROADMAP"
id = "abc123def456..."
```

复制 `id = "..."` 那一串（32 位十六进制），打开 `wrangler.toml`，把
`id = "REPLACE_WITH_KV_NAMESPACE_ID"` 里的占位符替换成它，保存。

### 5. 设置 admin 密码

```bash
wrangler secret put ADMIN_PASSWORD
```

会让你输入密码——**这个密码要和 HTML 里 admin 登录的密码一致**（也就是当前的
`Netvue123-`，或者你之后改成的新密码）。输入后回车，不显示字符是正常的。

### 6. 部署 Worker

```bash
wrangler deploy
```

输出会显示 Worker 的访问 URL，类似：

```
Published product-roadmap-sync (1.23 sec)
  https://product-roadmap-sync.<你的子域名>.workers.dev
```

**记下这个 URL**——下一步要填进 HTML。

### 7. 把 URL 填进 HTML

打开 `product-roadmap.html`，找到这一行（在 `<script>` 块顶部附近）：

```js
const WORKER_URL = "REPLACE_WITH_YOUR_WORKER_URL";
```

把 `REPLACE_WITH_YOUR_WORKER_URL` 换成上一步输出的完整 URL（带 `https://`
和 `.workers.dev`，不要带尾随斜杠）。

### 8. Commit + push

```bash
cd /Users/mzy/Documents/Codex/2026-05-07/roadmap-e-c-p-u-cam
git add .
git commit -m "feat: 接入 Cloudflare Worker + KV，admin 编辑自动同步到云端"
git push origin main
```

GitHub Pages 自动重新部署后，打开页面：
- 任何人打开都会先 fetch Worker，拿到云端最新数据
- admin 登录后编辑字段，2 秒 debounce 后自动 PUT 到 Worker
- 工具栏右上角会显示同步状态

## 日常使用

- 任何人打开页面：自动读云端最新，看不到的话回退到 HTML 里 BAKED_ROWS
- admin 登录后编辑：每次改字段都会触发 2 秒 debounce 自动保存
- 右上角同步状态指示器：
  - 「云端最新」绿点 — 当前数据来自云端
  - 「保存中…」黄点 — 正在 PUT
  - 「已保存」绿点 — debounce 写入成功
  - 「同步失败」红点 — 网络或鉴权问题
  - 「本地数据」灰点 — 还没接上 Worker（兜底使用 BAKED_ROWS）

## 改密码

如果哪天想改 admin 密码：

1. 在前端：按之前的方式重新算 SHA-256 hash，替换 `ADMIN_PWD_HASH` 常量
2. 同步给 Worker：
   ```bash
   cd worker
   wrangler secret put ADMIN_PASSWORD
   # 输入新密码
   ```
3. 重新部署 Worker：`wrangler deploy`
4. push HTML 改动

两边必须同步改，否则 admin 在前端能登录但写云端会 401。

## 看历史快照

每次保存会自动存一份 `v:<timestamp>` 副本，保留 90 天。要看可以直接访问：

```
https://product-roadmap-sync.<...>.workers.dev/api/roadmap/history
```

返回最近 100 个版本的时间戳列表。要回滚某一版，可以：

```
curl https://...workers.dev/api/roadmap/v/2026-05-20T12:34:56.789Z
```

拿到那一版 JSON 后，用 `curl -X PUT -H "Authorization: Bearer <密码>" -d @<文件> https://...workers.dev/api/roadmap` 写回当前。

(也可以直接在 Cloudflare dashboard → Workers & Pages → KV → 找到 namespace 手动改/删 key。)

## 安全说明

- 这是**软鉴权**：admin 密码用 Bearer Token 传给 Worker，Worker 端用 `wrangler secret` 加密存。普通用户没密码写不进去。
- 但密码以明文形式在浏览器和 Worker 之间走 HTTPS——没有更复杂的 OAuth/Session 机制。日常自用够了，但**不要发到公网公开宣传**。
- 如果哪天密码泄露：改密码（步骤见上）+ 旧的 sessionStorage 失效（关掉所有 admin 的 tab）。
