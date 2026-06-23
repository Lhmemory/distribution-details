#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1; then
  if [ -x "/tmp/node-v20.19.5-darwin-arm64/bin/npm" ]; then
    export PATH="/tmp/node-v20.19.5-darwin-arm64/bin:$PATH"
  else
    echo "未找到 npm。请先安装 Node.js 20+，然后重新运行本发布脚本。"
    exit 1
  fi
fi

echo "1/5 安装依赖"
npm ci

echo "2/5 检查生产依赖安全风险"
npm audit --omit=dev

echo "3/5 构建上线包"
npm run build

echo "4/5 检查当前 Git 状态"
git status --short --branch

echo "5/5 推送到 GitHub main，触发 GitHub Pages 部署"
git push origin main

echo "已推送。稍后可打开 GitHub Actions 查看部署进度："
echo "https://github.com/Lhmemory/distribution-details/actions"
open "https://github.com/Lhmemory/distribution-details/actions" >/dev/null 2>&1 || true
