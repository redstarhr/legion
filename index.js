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

const { handleInteractionError } = require('./utils/interactionErrorLogger');
const { handleGptChat } = require('./chat_gpt_bot/utils/chatHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.modals = new Collection();

loadCommands(client);
loadInteractions(client);

console.log('✅ 全ハンドラの読み込みが完了しました');

// イベント登録
client.once(readyEvent.name, () => readyEvent.execute(client));
client.on(interactionCreateEvent.name, async (interaction) => interactionCreateEvent.execute(interaction, client));
client.on(messageCreateEvent.name, (message) => messageCreateEvent.execute(message, client));
client.on(guildDeleteEvent.name, (guild) => guildDeleteEvent.execute(guild));

const port = process.env.PORT || 8080;
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Bot is running\n');
}).listen(port, () => {
  console.log(`✅ HTTP server listening on port ${port} for Cloud Run health checks.`);
});

// GCS から設定を読み込み → ログイン
async function loadConfigFromGCS(bucketName, filePath, envVarName) {
  try {
    const storage = new Storage();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    const [exists] = await file.exists();
    if (!exists) {
      console.warn(`⚠️ GCSファイルが見つかりません: gs://${bucketName}/${filePath}`);
      return;
    }

    const [data] = await file.download();
    const configValue = data.toString().trim();

    if (configValue) {
      if (!process.env[envVarName]) {
        process.env[envVarName] = configValue;
        console.log(`✅ GCSから ${envVarName} を読み込みました。`);
      } else {
        console.log(`ℹ️ 環境変数 ${envVarName} は既に設定済みのため、GCSからの読み込みをスキップしました。`);
      }
    } else {
      console.warn(`⚠️ GCSファイルは空です: gs://${bucketName}/${filePath}`);
    }
  } catch (error) {
    console.error(`❌ GCSからの設定読み込みに失敗: gs://${bucketName}/${filePath}`, error);
  }
}

async function startBot() {
  if (process.env.GCS_BUCKET_NAME) {
    await loadConfigFromGCS(process.env.GCS_BUCKET_NAME, 'openai_api_key.txt', 'OPENAI_API_KEY');
  } else {
    console.log('ℹ️ GCS_BUCKET_NAMEが設定されていないため、GCSからの設定読み込みをスキップします。');
  }

  await client.login(process.env.DISCORD_TOKEN);
}

startBot();
