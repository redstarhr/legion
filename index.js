// index.js

require('dotenv').config(); // .envファイルを読み込む
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Storage } = require('@google-cloud/storage'); // GCSクライアントを追加
const fs = require('fs');
const path = require('path');

// --- Bot Modules ---
const { checkAndCloseExpiredQuests } = require('./quest_bot/utils/deadlineManager');
const { initializeScheduler } = require('./quest_bot/utils/scheduler');
const questDataManager = require('./manager/questDataManager');
const { logError } = require('./utils/errorLogger');
const { handleInteractionError } = require('./utils/interactionErrorLogger');
const { handleGptChat } = require('./chat_gpt_bot/utils/chatHandler');

// --- GCSから設定を読み込む関数 ---
/**
 * GCSから設定ファイルを読み込み、環境変数に設定します。
 * @param {string} bucketName - GCSバケット名
 * @param {string} filePath - GCS内のファイルパス
 * @param {string} envVarName - 設定する環境変数名
 */
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
      // 環境変数がまだ設定されていない場合のみ、GCSからの値で設定する
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

// Discordクライアント初期化
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // ChatGPT応答に必要
  ]
});

// --- ハンドラコレクション初期化 ---
client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.modals = new Collection();

// --- モジュールごとのハンドラ読み込み ---
const botModules = fs.readdirSync(__dirname, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name)
  .filter(name =>
    fs.existsSync(path.join(__dirname, name, 'commands')) ||
    fs.existsSync(path.join(__dirname, name, 'interactions'))
  );

console.log(`🔄 ${botModules.length}個のモジュールを検出: [${botModules.join(', ')}]`);

for (const moduleName of botModules) {
  // コマンド読み込み
  const commandsPath = path.join(__dirname, moduleName, 'commands');
  if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, file));
      if (command?.data && command?.execute) {
        client.commands.set(command.data.name, command);
      } else {
        console.warn(`⚠️ 不正なコマンド: ${file}`);
      }
    }
  }

  // インタラクション読み込み（buttons / selectMenus / modals）
  const interactionsPath = path.join(__dirname, moduleName, 'interactions');
  if (fs.existsSync(interactionsPath)) {
    const interactionTypes = {
      buttons: client.buttons,
      selectMenus: client.selectMenus,
      modals: client.modals,
    };

    for (const [type, collection] of Object.entries(interactionTypes)) {
      const typePath = path.join(interactionsPath, type);
      if (fs.existsSync(typePath)) {
        const files = fs.readdirSync(typePath).filter(f => f.endsWith('.js'));
        for (const file of files) {
          const handler = require(path.join(typePath, file));
          if (handler?.customId && handler?.handle) {
            collection.set(handler.customId, handler);
          } else {
            console.warn(`⚠️ 不正なインタラクション: ${file}`);
          }
        }
      }
    }
  }
}

console.log('✅ 全ハンドラの読み込みが完了しました');

// --- interactionCreate ---
client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (command) await command.execute(interaction);

    } else if (interaction.isButton()) {
      for (const [key, handler] of client.buttons) {
        if (interaction.customId.startsWith(key)) {
          await handler.handle(interaction);
          return;
        }
      }

    } else if (interaction.isAnySelectMenu()) {
      for (const [key, handler] of client.selectMenus) {
        if (interaction.customId.startsWith(key)) {
          await handler.handle(interaction);
          return;
        }
      }

    } else if (interaction.isModalSubmit()) {
      for (const [key, handler] of client.modals) {
        if (interaction.customId.startsWith(key)) {
          await handler.handle(interaction);
          return;
        }
      }
    }
  } catch (error) {
    await handleInteractionError({
      interaction,
      error,
      context: `interactionCreate: ${interaction.customId || interaction.commandName}`
    });
  }
});

// --- messageCreate (ChatGPT自動応答) ---
client.on('messageCreate', (message) => {
  // Delegate all message handling to the specialized chat handler
  handleGptChat(message, client);
});

// --- Botがサーバーから削除された場合のデータ削除 ---
client.on('guildDelete', async guild => {
  console.log(`🗑️ Botが削除された: ${guild.name} (${guild.id})`);
  try {
    await questDataManager.deleteGuildData(guild.id);
    // TODO: GPTの設定データ削除処理も追加予定
    // await chatGptDataManager.deleteGuildData(guild.id);
  } catch (error) {
    console.error(`⚠️ ギルド削除時の処理に失敗: ${guild.id}`, error);
  }
});

// --- Bot起動時 ---
client.once('ready', () => {
  console.log(`✅ Bot起動成功: ${client.user.tag}`);

  // クエスト期限確認（毎分）
  setInterval(() => {
    checkAndCloseExpiredQuests(client);
  }, 60 * 1000);

  // 定期処理の初期化
  initializeScheduler(client);
});

// --- Bot起動処理 ---
async function startBot() {
  // GCSからOpenAI APIキーを読み込む
  if (process.env.GCS_BUCKET_NAME) {
    await loadConfigFromGCS(process.env.GCS_BUCKET_NAME, 'openai_api_key.txt', 'OPENAI_API_KEY');
  } else {
    console.log('ℹ️ GCS_BUCKET_NAMEが設定されていないため、GCSからの設定読み込みをスキップします。');
  }

  // Discordにログイン
  client.login(process.env.DISCORD_TOKEN);
}

startBot();
