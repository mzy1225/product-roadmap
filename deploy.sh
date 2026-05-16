#!/bin/bash
# 一键部署到 GitHub Pages
# 用法：在 Mac Terminal 里 cd 到本目录然后执行 ./deploy.sh
# 第一次跑前 chmod +x deploy.sh

set -e
cd "$(dirname "$0")"

echo "🧹 清理可能残留的 git 锁"
rm -f .git/index.lock

echo "📦 暂存所有改动"
git add -A

echo "📊 即将提交的内容"
git diff --cached --stat | tail -10

echo ""
read -p "确认提交并推送到 GitHub？(y/n) " yn
[[ "$yn" != "y" ]] && { echo "已取消"; exit 0; }

git commit -m "Bake 2026-05-16 SKU data + roadmap v3 features

- 6 视图：摘要 / 矩阵 / 时间线 / 渠道空缺 / 依赖关系 / 版本对比
- 健康度红黄绿色块、Owner / 待决策 / 待评审标签
- Drawer 内联编辑（点击任意字段编辑，自动提示导出）
- 单 SPU 深链接、未导出 dirty 提醒
- 烘焙 60 行真实 SKU + 44 张压缩产品图（47MB → 0.68MB）
- 导出 PNG / PDF 汇报态
- 基准 + diff 视图（localStorage）
- SKU notes 多行、平台模组、跨 SPU 依赖"

git push origin main

echo ""
echo "✅ 已推送。等 1-2 分钟 GitHub Pages 构建完成后访问："
echo "   https://mzy1225.github.io/product-roadmap/"
echo ""
echo "如未启用 Pages："
echo "   仓库 → Settings → Pages → Source = Deploy from a branch → main / root → Save"
