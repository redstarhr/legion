#!/bin/bash

# --- Configuration ---
set -e # Exit immediately if a command exits with a non-zero status.

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="$HOME/legion" # プロジェクト名を変更

# --- Error Handling ---
handle_error() {
    local exit_code=$?
    echo -e "${RED}❌ エラーが発生しました (終了コード: $exit_code, 行番号: $1)。処理を中止します。${NC}"
    exit $exit_code
}
trap 'handle_error $LINENO' ERR

echo -e "${GREEN}--- Legion管理Bot サーバー初期化スクリプト開始 ---${NC}"

# --- 1. System Setup ---
echo -e "\n${YELLOW}1. システムのセットアップ中...${NC}"
echo "🕒 タイムゾーンを Asia/Tokyo に設定"
sudo timedatectl set-timezone Asia/Tokyo

echo "📦 必須パッケージをインストール"
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y git curl rsync

echo "📦 Node.js (v18.x) をインストール"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "🔧 Node.js と npm のバージョン確認:"
node -v
npm -v

echo "🚀 PM2 をグローバルインストール"
sudo npm install -g pm2

# --- 2. Project Setup ---
echo -e "\n${YELLOW}2. プロジェクトのセットアップ中...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${RED}エラー: ディレクトリ '$PROJECT_DIR' は既に存在します。${NC}"
    echo "このスクリプトは新規サーバーの初期化用です。既存の環境を更新する場合は 'update.sh' を使用してください。"
    exit 1
fi

# この辺りにssh接続の設定作成を追加

echo "📂 GitHubからリポジトリをクローンします (SSH経由): ${PROJECT_DIR}"
# SSHキーがサーバーに設定済みであることを前提とします
git clone git@github.com:star-discord/legion_kanri_bot.git "$PROJECT_DIR"

cd "$PROJECT_DIR"

echo "📝 .env ファイルを作成します"
cat > .env << EOL
# Discord Bot Settings
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=

# Google Cloud Storage Settings
GCS_BUCKET_NAME=
GOOGLE_APPLICATION_CREDENTIALS=./gcs-key.json
EOL
echo -e "${GREEN}✅ '.env' のテンプレートを作成しました。${NC}"
echo -e "${YELLOW}⚠️ 'gcs-key.json' という名前でサービスアカウントキーをこのディレクトリに配置することを推奨します。${NC}"

echo "🔑 スクリプトに実行権限を付与します"
find . -type f -name "*.sh" -exec chmod +x {} \;
echo "✅ すべてのシェルスクリプトに実行権限を付与しました。"

echo -e "\n${YELLOW}*** 重要: .env ファイルを設定してください ***${NC}"
echo "1. Botのトークン等を '.env' ファイルに設定する必要があります。"
echo "   エディタでファイルを開き、必須項目を入力してください: ${GREEN}nano .env${NC}"
read -p ".envファイルの設定が完了したら、Enterキーを押して続行してください..."

# --- 3. Dependencies & Deployment ---
echo -e "\n${YELLOW}3. 依存関係のインストールとデプロイ...${NC}"
echo "📦 npm パッケージをインストールしています (数分かかる場合があります)..."
npm install --no-audit --no-fund

echo "📡 スラッシュコマンドをDiscordに登録しています..."
# deploy-commands.js が存在することを前提とします
if [ -f "devcmd.js" ]; then
    node devcmd.js
else
    echo -e "${YELLOW}⚠️ 'devcmd.js' が見つかりません。コマンドの登録をスキップします。${NC}"
fi

# --- 4. PM2 Setup ---
echo -e "\n${YELLOW}4. PM2でBotを起動し、自動起動を設定します...${NC}"

echo "🚀 PM2でBotを起動します..."
# ecosystem.config.js が存在することを前提とします
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
else
    echo -e "${YELLOW}⚠️ 'ecosystem.config.js' が見つかりません。直接 'index.js' を起動します。${NC}"
    pm2 start index.js --name "legion_kanri_bot"
fi

echo "💾 現在のPM2プロセスリストを保存します..."
pm2 save

echo -e "\n${YELLOW}*** 重要: サーバー再起動時にBotを自動起動させる設定 ***${NC}"
echo "以下のコマンドをコピーして実行してください:"

# Generate the startup command but let the user run it
STARTUP_COMMAND=$(pm2 startup | grep "sudo")
if [ -n "$STARTUP_COMMAND" ]; then
    echo -e "${GREEN}${STARTUP_COMMAND}${NC}"
else
    echo -e "${RED}PM2の自動起動コマンドの生成に失敗しました。手動で 'pm2 startup' を実行してください。${NC}"
fi

echo -e "\n${GREEN}✅ 初期化処理が正常に完了しました！${NC}"
echo "----------------------------------------"
echo "💡 次のステップ:"
echo "1. 上記の 'sudo ...' で始まるコマンドを実行して、自動起動を有効化してください。"
echo "2. Botの動作状況は以下のコマンドで確認できます:"
echo -e "   - ${GREEN}pm2 status${NC} (プロセスの状態確認)"
echo -e "   - ${GREEN}pm2 logs legion_kanri_bot${NC} (ログのリアルタイム表示)"
echo ""
echo "🔧 Botの更新:"
echo "   今後の更新は、プロジェクトディレクトリ内で以下のコマンドを実行してください:"
echo -e "   - ${GREEN}cd ~/legion && ./update.sh${NC}"
echo "----------------------------------------"