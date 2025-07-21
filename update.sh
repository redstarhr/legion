#!/bin/bash

# エラー時に処理を停止
set -e

# --- Configuration ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="$HOME/star_kanri_bot"

# --- Error Handling ---
handle_error() {
    local exit_code=$?
    echo -e "${RED}❌ エラーが発生しました (終了コード: $exit_code, 行番号: $1)。処理を中止します。${NC}"
    # エラー発生時にバックアップから自動復元
    if [ -d "$TEMP_BACKUP" ]; then
        echo -e "${YELLOW}🔧 一時バックアップから復元を試みます...${NC}"
        if [ -f "scripts/backup_handler.sh" ]; then
            if ./scripts/backup_handler.sh restore "$TEMP_BACKUP"; then
                echo -e "${GREEN}✅ バックアップからの復元が完了しました。${NC}"
            else
                echo -e "${RED}❌ バックアップからの復元に失敗しました。手動で確認してください: $TEMP_BACKUP${NC}"
            fi
        else
            echo -e "${RED}❌ バックアップヘルパースクリプトが見つかりません。手動で確認してください: $TEMP_BACKUP${NC}"
        fi
        rm -rf "$TEMP_BACKUP"
    fi
    exit $exit_code
}
# エラートラップを設定
trap 'handle_error $LINENO' ERR

print_usage() {
  echo -e "\n💡 使用可能なオプション:"
  echo "  ./update.sh          : 通常更新"
  echo "  ./update.sh -f       : 強制同期（ローカル変更破棄）"
  echo "  ./update.sh -s       : PM2操作スキップ"
  echo -e "\n🔧 トラブルシューティング:"
  echo "  Bot起動確認: pm2 status"
  echo "  ログ確認: pm2 logs star-kanri-bot"
}

echo -e "${GREEN}--- STAR管理Bot 更新スクリプト ---${NC}"

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

# --- スクリプト権限の事前設定 ---
# git pullなどで失われた可能性のある実行権限を、処理の最初に設定します。
find . -type f -name "*.sh" -exec chmod +x {} \;

# --- Pre-flight Checks ---
./scripts/pre-flight-check.sh

# --- 2. Backup ---
TEMP_BACKUP="/tmp/star_kanri_update_backup_$$"
echo -e "\n${YELLOW}2. 重要ファイルを一時バックアップしています...${NC}"
if [ ! -f "scripts/backup_handler.sh" ]; then
    echo -e "${RED}❌ バックアップヘルパースクリプト 'scripts/backup_handler.sh' が見つかりません。${NC}"
    exit 1
fi
./scripts/backup_handler.sh backup "$TEMP_BACKUP"
echo -e "${GREEN}✅ バックアップ完了。${NC}"

# --- 3. Git Sync ---
echo -e "\n${YELLOW}3. GitHubリポジトリと同期しています...${NC}"
git fetch origin

if [ "$FORCE_SYNC" = true ]; then
  echo "⚡ 強制同期モード: ローカルの変更を破棄して同期します。"
  git reset --hard origin/master
  git clean -fdx
  echo -e "${GREEN}✅ 強制同期が完了しました。${NC}"
else
  echo "🔄 通常更新モード: 最新の変更を取り込みます。"
  if git merge origin/master --no-edit; then
    echo -e "${GREEN}✅ GitHub最新版への更新完了${NC}"
  else
    echo -e "${RED}⚠️ マージで競合が発生しました${NC}"
    echo "💡 競合を手動で解決するか、'./update.sh -f' で強制同期してください。"
    exit 1
  fi
fi

# --- 4. スクリプト権限の再設定 ---
# git pullで変更された可能性のあるスクリプトの実行権限を再設定します
echo -e "\n${YELLOW}4. スクリプトの実行権限を更新しています...${NC}"
find . -type f -name "*.sh" -exec chmod +x {} \;

# --- 5. Restore Critical Files ---
echo -e "\n${YELLOW}5. 重要ファイルを復元しています...${NC}"
./scripts/backup_handler.sh restore "$TEMP_BACKUP"
rm -rf "$TEMP_BACKUP"
echo -e "${GREEN}✅ 復元完了。${NC}"

# --- 5. Install Dependencies & Deploy Commands ---
echo -e "\n${YELLOW}6. 依存関係のインストールとコマンドのデプロイ...${NC}"
if [ ! -f package.json ]; then
  echo -e "${RED}❌ package.json が見つかりません。リポジトリが破損している可能性があります。${NC}"
  exit 1
fi
echo "📦 npm パッケージをインストール中..."
if ! npm install --no-audit --no-fund; then
  echo -e "${RED}❌ 'npm install' に失敗しました。${NC}"
  echo -e "💡 ネットワーク接続を確認するか、npmキャッシュをクリアしてみてください: ${YELLOW}npm cache clean --force${NC}"
  exit 1
fi

if [ ! -f devcmdup.js ]; then
  echo -e "${RED}❌ devcmdup.js が見つかりません。リポジトリが破損している可能性があります。${NC}"
  exit 1
fi
echo "📡 スラッシュコマンドをDiscordに登録中..."
if ! node devcmdup.js; then
  echo -e "${RED}❌ スラッシュコマンドの登録に失敗しました。${NC}"
  echo "💡 上記のエラーログを確認し、コマンド定義ファイルを修正してください。"
  exit 1
fi

# PM2操作（スキップオプション対応）
if [ "$SKIP_PM2" = false ]; then
  echo -e "\n${YELLOW}7. Botプロセスを再起動しています...${NC}"
  
  # PM2プロセスの確認
  if command -v pm2 > /dev/null 2>&1; then
    # 既存のプロセス確認
    if pm2 describe star-kanri-bot > /dev/null 2>&1; then
      pm2 restart star-kanri-bot --update-env
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
  echo -e "\n${YELLOW}7. PM2操作をスキップしました。${NC}"
fi

echo -e "\n${GREEN}✅ star_kanri_bot 更新処理が正常に完了しました。${NC}"

print_usage
