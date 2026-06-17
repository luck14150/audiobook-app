# DataMind 开放平台 — GitHub Pages 部署脚本 (PowerShell 版)
# 把 dist/ 内容推送到 gh-pages 分支 → 访问 https://luck14150.github.io/audiobook-app/

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== DataMind 开放平台 GitHub Pages 部署脚本 ===" -ForegroundColor Cyan
Write-Host ""

# 1. 构建
Write-Host "[1/4] 构建生产版本..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "构建失败，请先修复错误" -ForegroundColor Red
  exit 1
}

# 2. 进入 dist 目录并初始化 git
Write-Host "[2/4] 准备部署包..." -ForegroundColor Green
$cwd = Get-Location
Set-Location dist

if (-not (Test-Path .git)) {
  git init
  git checkout -b gh-pages
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git add -A
git commit -m "chore(deploy): deploy DataMind @ $timestamp" 2>$null | Out-Null

# 3. 推送到 gh-pages
Write-Host "[3/4] 推送 gh-pages 分支到 GitHub..." -ForegroundColor Green
git remote add gh-origin https://github.com/luck14150/audiobook-app.git 2>$null | Out-Null
git push -f gh-origin gh-pages
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "⚠️  推送失败，请检查：" -ForegroundColor Yellow
  Write-Host "   - GitHub 仓库是否为：https://github.com/luck14150/audiobook-app.git"
  Write-Host "   - 是否有写权限（git push 需要登录或 token）"
  Write-Host ""
  Write-Host "手动替代方式：把 dist/ 目录里的 4 个文件 (.nojekyll、404.html、index.html、assets/) 直接通过 GitHub 网页 UI 上传到 gh-pages 分支" -ForegroundColor Gray
  Set-Location $cwd
  exit 1
}

Set-Location $cwd

# 4. 完成
Write-Host ""
Write-Host "[4/4] 部署成功！" -ForegroundColor Green
Write-Host ""
Write-Host "访问地址：" -ForegroundColor Cyan
Write-Host "  https://luck14150.github.io/audiobook-app/"
Write-Host ""
Write-Host "注意：首次部署需要 1-3 分钟让 GitHub Pages 服务端生效。" -ForegroundColor Yellow
Write-Host "手机端：确保浏览器输入完整 URL（包含末尾的 /），避免缓存。"
Write-Host ""
