# 产品 Roadmap 静态部署

这个目录可以作为静态网站发布。入口文件是 `index.html`，会自动跳转到 `product-roadmap.html`。

## 需要上传的文件

- `index.html`
- `product-roadmap.html`（已烘焙 2026-05-16 的真实 SKU 数据 60 行）
- `images/`（产品图片，按 SKU 行映射）
- `product-roadmap-template.csv`、`product-roadmap-template.xlsx`（导入模板）
- `.nojekyll`（用于 GitHub Pages，禁用 Jekyll 处理）

截图 PNG 文件不是运行必需项，可以不上传。

## 已部署到 GitHub Pages

仓库：<https://github.com/mzy1225/product-roadmap>

如果已启用 Pages，每次 `git push` 到默认分支后等 1-2 分钟即可访问最新版。在 `Settings -> Pages` 检查发布分支与目录。

## 发布步骤（首次或迁移）

1. 在 GitHub 仓库的 `Settings -> Pages` 选 Source = `Deploy from a branch`，Branch = `main`，目录 = `/ (root)`。
2. 保存后 GitHub 会给出形如 `https://<用户名>.github.io/product-roadmap/` 的网址。
3. 把网址发给同事，他们用浏览器打开即可（无需登录、无需安装）。

## Netlify / Vercel 备选

1. 新建站点 → Connect Repo → 选 `mzy1225/product-roadmap`。
2. 不需要构建命令；发布目录留空（根目录）。
3. 部署完成后会给一个 `*.netlify.app` 或 `*.vercel.app` 域名。

## 运行依赖（CDN）

页面依赖 CDN 加载：`xlsx`（Excel 导入导出）、`jszip`（解压 Excel 图片）、`html-to-image`（导出 PNG）、`jspdf`（导出 PDF）。部署环境需要能访问 `cdn.jsdelivr.net`。

## 角色与登录

默认所有访客 = **浏览模式**：可以看所有视图、hover 卡片、打开 drawer 查看详情、导入/导出 Excel、导出 PNG/PDF。**不能在 drawer 内编辑任何字段，也看不到"保存为基准"按钮。**

点侧栏顶部「登录」按钮 → 输入管理员密码 → 进入**管理员模式**：drawer 字段全部可点击编辑、状态下拉可改、可保存当前为 diff 视图基准。登录状态存到 `sessionStorage`，关闭标签页即失效（下次需要重新登录）。

**默认密码（2026-05-16 设置）：`Netvue123-`**

修改密码：

```bash
# 1. 用新密码加 salt 计算哈希
echo -n "roadmap-salt-2026:你的新密码" | shasum -a 256
#    输出形如 abc123...def456 这样的 64 位 16 进制串

# 2. 在 product-roadmap.html 里搜 ADMIN_PWD_HASH，替换成新哈希
# 3. commit + push
```

> ⚠️ **这是软门禁，不是真鉴权。** 静态站点没有后端，懂技术的人打开浏览器 DevTools 改一行 JS 就能进入管理员模式；而且数据本身（包含所有战略定位、竞品打法等）会下发到访客浏览器。
>
> 如果你的诉求是"viewer 看不到敏感字段"或"必须有审计日志"，请换部署方案：
> - **Cloudflare Access** — 在 Pages 前面挂 SSO 网关，按邮箱白名单放行。
> - **Netlify Identity** — Netlify 自带的用户系统 + JWT。
> - **自建后端** — Vercel Serverless / Cloudflare Workers + Cookie session。

## 更新数据

两种方式：

A. **页面里直接改**：drawer 点击任何字段即可编辑（Enter 保存 / Esc 取消），改完点工具栏「导出 Excel」拿到最新文件。

B. **重新烘焙**：在新的 Excel 上线后，把它转成 `BAKED_ROWS` 数组并替换 `product-roadmap.html` 里同名常量；图片用 480px JPEG q80 压到 `images/` 目录。Commit + push 即可发布。
