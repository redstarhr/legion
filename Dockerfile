# --- Base Stage ---
# 共通のセットアップを定義
FROM node:18-slim AS base

# タイムゾーンをJSTに設定
ENV TZ=Asia/Tokyo
# コンテナ内の作業ディレクトリを設定
WORKDIR /usr/src/app
# 依存関係の解決を効率化するため、package.jsonを先にコピー
COPY package*.json ./

# --- Development Stage (Dev Container用) ---
FROM base AS development
# 開発に必要なすべての依存関係をインストール
RUN npm install --no-audit --no-fund --ignore-scripts
COPY . .
# Dev Container起動時のデフォルトコマンド
CMD [ "npm", "run", "dev" ]

# --- Production Stage (Cloud Run用) ---
FROM base AS production
# 本番環境に必要な依存関係のみをインストール
RUN npm install --omit=dev --no-audit --no-fund --ignore-scripts && npm cache clean --force
COPY . .
# コンテナ起動時に実行するコマンドを定義
CMD [ "node", "index.js" ]