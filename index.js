// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const http = require('http');
const { Storage } = require('@google-cloud/storage');

const { loadCommands } = require('./handlers/commandLoader');
const { loadInteractions } = require('./handlers/interactionLoader');
const readyEvent = require('./events/ready');
const interactionCreateEvent = require('./events/interactionCreate');
const messageCreateEvent = require('./events/messageCreate');
const guildDeleteEvent = require('./events/guildDelete');
const { registerCommands } = require('./events/devcmd'); // コマンド登録
const { handleInteractionError } = require('./utils/interactionErrorLogger');
const { handleGptChat } = require('./chat_gpt_bot/utils/chatHandler');

// Discord Client 初期化
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// 各コレクションの初期化
client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.modals = new Collection();

// コマンド & インタラクション ロード
loadCommands(client);
loadInteractions(client);
console.log('✅ 全ハンドラの読み込みが完了しました');

// イベント登録
client.once(readyEvent.name, () => readyEvent.execute(client));
client.on(interactionCreateEvent.name, async (interaction) =>
  interactionCreateEvent.execute(interaction, client)
);
client.on(messageCreateEvent.name, (message) =>
  messageCreateEvent.execute(message, client)
);
client.on(guildDeleteEvent.name, (guild) =>
  guildDeleteEvent.execute(guild)
);

// HTTP サーバー（Cloud Run ヘルスチェック用）
const port = process.env.PORT || 8080;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running\n');
}).listen(port, () => {
  console.log(`✅ HTTP server listening on port ${port} for Cloud Run health checks.`);
});

// GCS認証とBot起動
async function startBot() {
  try {
    // GCS 接続確認
    if (process.env.GCS_BUCKET_NAME) {
      console.log(`ℹ️ GCSバケット '${process.env.GCS_BUCKET_NAME}' への接続を確認しています...`);
      const storage = new Storage(); // 認証は環境変数 GOOGLE_APPLICATION_CREDENTIALS に依存
      const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
      const [exists] = await bucket.exists();
      if (!exists) {
        throw new Error(`バケット '${process.env.GCS_BUCKET_NAME}' が見つかりません。`);
      }
      console.log('✅ GCSへの接続を確認しました。');
    } else {
      console.warn('⚠️ GCS_BUCKET_NAMEが設定されていないため、GCSへの接続確認をスキップします。');
    }

    // スラッシュコマンド登録（ギルド & グローバル）
    await registerCommands();

    // Discordにログイン
    await client.login(process.env.DISCORD_TOKEN);
  } catch (err) {
    console.error('❌ GCSまたはDiscordの起動時エラー:', err);
    process.exit(1);
  }
}

startBot();
