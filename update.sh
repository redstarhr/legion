#!/bin/bash

# エラー時に処理を停止
set -e

# --- Configuration ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="$HOME/legion" # プロジェクトのディレクトリ
PM2_PROCESS_NAME="legion_kanri_bot" # ecosystem.config.js の name と合わせる

# --- Error Handling ---
handle_error() {
    local exit_code=$?
    echo -e "${RED}❌ エラーが発生しました (終了コード: $exit_code, 行番号: $1)。処理を中止します。${NC}"
    exit $exit_code
}
# エラートラップを設定
trap 'handle_error $LINENO' ERR

print_usage() {
  echo -e "\n💡 使用可能なオプション:"
  echo "  ./update.sh          : 通常更新 (git pull)"
  echo "  ./update.sh -f       : 強制同期 (ローカルの変更を破棄して更新)"
  echo "  ./update.sh -s       : PM2操作をスキップ"
  echo -e "\n🔧 トラブルシューティング:"
  echo "  Bot起動確認: pm2 status"
  echo "  ログ確認: pm2 logs ${PM2_PROCESS_NAME}"
}

echo -e "${GREEN}--- Legion管理Bot 更新スクリプト ---${NC}"

# --- Argument Parsing ---
FORCE_SYNC=false
SKIP_PM2=false
for arg in "$@"; do
  case $arg in
    -f|--force-sync)
      FORCE_SYNC=true
      shift
      ;;
    -s|--skip-pm2)
      SKIP_PM2=true
      shift
      ;;
  esac
done

if [ "$FORCE_SYNC" = true ]; then
  echo "⚡ 強制同期モードが有効です。ローカルの変更は破棄されます。"
fi
if [ "$SKIP_PM2" = true ]; then
  echo "⏭️ PM2スキップモード: PM2操作をスキップします"
fi

# --- 1. Pre-flight Checks ---
echo -e "\n${YELLOW}1. 実行環境をチェック中...${NC}"
if [ ! -d "$PROJECT_DIR/.git" ]; then
  echo -e "${RED}❌ Gitリポジトリが見つかりません: $PROJECT_DIR${NC}"
  echo "💡 'init_server.sh' を使って初回セットアップを行ってください。"
  exit 1
fi
cd "$PROJECT_DIR"

# --- 2. Git Sync ---
echo -e "\n${YELLOW}2. GitHubリポジトリと同期しています...${NC}"
git fetch origin

if [ "$FORCE_SYNC" = true ]; then
  echo "⚡ 強制同期モード: ローカルの変更を破棄して同期します。"
  git reset --hard origin/main
  echo -e "${GREEN}✅ 強制同期が完了しました。${NC}"
else
  echo "🔄 通常更新モード: 最新の変更を取り込みます。"
  git stash
  if git pull origin main --rebase; then
    git stash pop || echo "退避した変更はありませんでした。"
    echo -e "${GREEN}✅ GitHub最新版への更新完了${NC}"
  else
    git stash pop
    echo -e "${RED}⚠️ マージで競合が発生しました${NC}"
    echo "💡 競合を手動で解決するか、'./update.sh -f' で強制同期してください。"
    exit 1
  fi
fi

# --- 3. スクリプト権限の再設定 ---
echo -e "\n${YELLOW}3. スクリプトの実行権限を更新しています...${NC}"
find . -type f -name "*.sh" -exec chmod +x {} \;
echo "✅ 実行権限の更新が完了しました。"

# --- 4. Install Dependencies & Deploy Commands ---
echo -e "\n${YELLOW}4. 依存関係のインストールとコマンドのデプロイ...${NC}"
echo "📦 npm パッケージをインストール中..."
npm install --no-audit --no-fund

# ↓ スラッシュコマンド登録スクリプト（現在未使用のためコメントアウト）
# echo "📡 スラッシュコマンドをDiscordに登録中..."
# node devcmd.js

# --- 5. PM2 Restart (if not skipped) ---
if [ "$SKIP_PM2" = false ]; then
  echo -e "\n${YELLOW}5. Botプロセスを再起動しています...${NC}"
  if command -v pm2 > /dev/null 2>&1; then
    if pm2 describe ${PM2_PROCESS_NAME} > /dev/null 2>&1; then
      pm2 restart ${PM2_PROCESS_NAME} --update-env
      pm2 save
      echo -e "${GREEN}✅ Botが正常に再起動されました。${NC}"
    else
      echo -e "${YELLOW}⚠️ PM2プロセスが見つかりません。手動で起動してください:${NC}"
      echo "   cd $PROJECT_DIR && pm2 start ecosystem.config.js"
    fi
  else
    echo -e "${YELLOW}⚠️ PM2がインストールされていません。手動で起動してください:${NC}"
    echo "   cd $PROJECT_DIR && node index.js"
  fi
else
  echo -e "\n${YELLOW}5. PM2操作をスキップしました。${NC}"
fi

echo -e "\n${GREEN}✅ Legion管理Bot 更新処理が正常に完了しました。${NC}"

print_usage
