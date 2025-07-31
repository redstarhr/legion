# 1. ベースイメージとして公式のNode.js v18スリム版を使用
FROM node:18-slim

# 2. コンテナ内の作業ディレクトリを設定
WORKDIR /usr/src/app

# 3. 依存関係の解決を効率化するため、package.jsonを先にコピー
COPY package*.json ./

# 4. 本番環境に必要なnpmパッケージのみをインストール
#    キャッシュをクリーンにしてイメージサイズを削減
RUN npm install --omit=dev --no-audit --no-fund --ignore-scripts && npm cache clean --force

# 5. アプリケーションのソースコードをコピー
COPY . .

# 6. Discord Botは通常HTTPポートをリッスンしないため、EXPOSEは不要

# 7. コンテナ起動時に実行するコマンドを定義
#    Cloud RunがこのコマンドでBotを起動します
CMD [ "node", "index.js" ]