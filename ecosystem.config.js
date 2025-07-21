// ecosystem.config.js
require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'legion_kanri_bot',
      script: './index.js',

      // --- 実行オプション ---
      exec_mode: 'fork', // 1インスタンスで実行（Botには通常これで十分）
      instances: 1,

      // --- 監視と再起動 ---
      autorestart: true, // クラッシュ時に自動で再起動
      restart_delay: 5000, // 5秒待ってから再起動（クラッシュループ防止）
      max_memory_restart: '256M', // メモリリーク対策

      // --- ログ設定 ---
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/error.log', // エラーログのパス
      out_file: './logs/out.log', // 通常ログのパス
      merge_logs: true,

      // --- 本番環境用設定 ---
      env: {
        NODE_ENV: 'production',
        DISCORD_TOKEN: process.env.DISCORD_TOKEN,
        CLIENT_ID: process.env.CLIENT_ID,
        GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        // 本番環境ではウォッチモードを無効化
        watch: false,
      },

      // --- 開発環境用設定 (pm2 start ecosystem.config.js --env development) ---
      env_development: {
        NODE_ENV: 'development',
        // 開発中はファイル変更を監視して自動再起動
        watch: true,
        watch_options: {
          ignore_watch: ['node_modules', 'data', 'logs', '*.bak', '*.md'],
        },
      },
    },
  ],
};
