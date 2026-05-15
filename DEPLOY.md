# 产品 Roadmap 静态部署

这个目录现在可以作为静态网站发布。入口文件是 `index.html`，会打开 `product-roadmap.html`。

## 需要上传的文件

- `index.html`
- `product-roadmap.html`
- `product-roadmap-template.csv`
- `product-roadmap-template.xlsx`
- `.nojekyll`（用于 GitHub Pages）

截图 PNG 文件不是运行必需项，可以不上传。

## 推荐部署方式

### GitHub Pages

1. 新建一个 GitHub 仓库。
2. 上传上述文件到仓库根目录。
3. 在仓库 `Settings -> Pages` 里选择从默认分支根目录发布。
4. 打开 Pages 提供的网址即可使用。

### Netlify / Vercel

1. 新建站点。
2. 把本目录作为静态站点上传或连接仓库。
3. 不需要构建命令，发布目录使用根目录。

## 运行依赖

页面依赖 CDN 加载 `xlsx` 和 `jszip`，用于 Excel/CSV 导入导出和 Excel 图片读取。部署环境需要能访问 `cdn.jsdelivr.net`。

