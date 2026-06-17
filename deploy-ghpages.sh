#!/bin/bash
#
# DataMind 开放平台 — GitHub Pages 部署脚本（Windows Git Bash / Linux / macOS 可用）
# 目标：将 dist/ 目录内容推送到 gh-pages 分支，访问地址：
#       https://luck14150.github.io/audiobook-app/
#
# 使用方法（任选其一）：
#   A. 双击运行 (Windows Git Bash)   →  bash deploy-ghpages.sh
#   B. 在终端执行                     →  sh deploy-ghpages.sh
#   C. 手动执行下列命令（最稳妥）

set -e

# 1. 构建
echo ">> Step 1/4: Building production bundle..."
npm run build

# 2. 进入 dist 目录并创建独立的 git 提交
echo ">> Step 2/4: Publishing dist/ to gh-pages branch..."
cd dist

# 如果本地没有 git，则在 dist 内创建一个
if [ ! -d .git ]; then
  git init
  git checkout -b gh-pages
fi

git add -A
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "chore(deploy): deploy DataMind @ ${TIMESTAMP}" || echo "(nothing to commit, already up to date)"

# 3. 推送到远程 gh-pages 分支
#    注意：确保当前仓库的 remote origin 是 https://github.com/luck14150/audiobook-app.git
echo ">> Step 3/4: Force-push to origin/gh-pages..."
git remote add gh-origin https://github.com/luck14150/audiobook-app.git 2>/dev/null || true
git push -f gh-origin gh-pages

# 4. 完成
cd ..
echo ""
echo "✅ 部署完成！"
echo "   请访问：https://luck14150.github.io/audiobook-app/"
echo "   首次部署需要 1-3 分钟在 GitHub 端生效。"
echo ""
