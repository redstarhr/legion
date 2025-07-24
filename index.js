// index.js

require('dotenv').config(); // .envファイルを読み込む
const { Client, GatewayIntentBits, Collection, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

// --- Bot Modules ---
// 各機能のメインファイルをインポート
const { checkAndCloseExpiredQuests } = require('./quest_bot/utils/deadlineManager');
const { initializeScheduler } = require('./quest_bot/utils/scheduler');
const questDataManager = require('./manager/questDataManager');
const { logError } = require('./utils/errorLogger');
const { handleInteractionError } = require('./utils/interactionErrorLogger');
// ChatGPT Bot 用のマネージャーをインポート
const { getConfig: getGptConfig, generateReply: generateGptReply } = require('./chat_gpt_bot/manager/chatGptManager');
// TODO: chat_gpt_bot用のデータマネージャーも後で作成・インポートする
// const chatGptDataManager = require('./chat_gpt_bot/utils/dataManager');

// Botクライアントを作成（必要なIntentを指定）
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // ChatGPTがメッセージに応答する場合に必要
  ]
});

// コマンド、ボタン、モーダル用のコレクションを用意
client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.modals = new Collection();

// --- ハンドラ読み込み ---

// Botモジュールを動的に検出
const botModules = fs.readdirSync(__dirname, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name)
  // モジュールと判断する条件: 'commands' または 'interactions' ディレクトリを持つ
  .filter(name =>
    fs.existsSync(path.join(__dirname, name, 'commands')) ||
    fs.existsSync(path.join(__dirname, name, 'interactions'))
  );

console.log(`🔄 ${botModules.length}個のモジュールからハンドラを読み込みます: [${botModules.join(', ')}]`);

for (const moduleName of botModules) {

    // コマンド
    const commandsPath = path.join(__dirname, moduleName, 'commands');
    if (fs.existsSync(commandsPath)) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            try {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                } else {
                    console.warn(`[⚠️警告] ${filePath} は不正なコマンド形式です。`);
                }
            } catch (error) {
                console.error(`[❌エラー] ${file} の読み込みに失敗しました:`, error);
            }
        }
    }

    // インタラクション (buttons, selectMenus, modals)
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
                const interactionFiles = fs.readdirSync(typePath).filter(file => file.endsWith('.js'));
                for (const file of interactionFiles) {
                    try {
                        const filePath = path.join(typePath, file);
                        const interactionHandler = require(filePath);
                        if ('customId' in interactionHandler && 'handle' in interactionHandler) {
                            collection.set(interactionHandler.customId, interactionHandler);
                        } else {
                            console.warn(`[⚠️警告] ${filePath} は不正なインタラクションハンドラ形式です。`);
                        }
                    } catch (error) {
                        console.error(`[❌エラー] ${file} の読み込みに失敗しました:`, error);
                    }
                }
            }
        }
    }
}
console.log('✅ ハンドラの読み込みが完了しました。');


// ✅ interactionCreate イベントのハンドリング
client.on('interactionCreate', async interaction => {
  try {
    // スラッシュコマンドの場合
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (command) await command.execute(interaction);

    // ボタンが押された場合
    } else if (interaction.isButton()) {
      let handler;
      // customIdの前方一致でハンドラを検索 (例: 'quest_accept_12345')
      for (const [key, value] of client.buttons) {
        if (interaction.customId.startsWith(key)) {
          handler = value;
          break;
        }
      }
      if (handler) await handler.handle(interaction);

    // セレクトメニューが選択された場合
    } else if (interaction.isAnySelectMenu()) {
      let handler; 
      for (const [key, value] of client.selectMenus) {
        if (interaction.customId.startsWith(key)) {
          handler = value;
          break;
        }
      }
      if (handler) await handler.handle(interaction);

    // モーダルが送信された場合
    } else if (interaction.isModalSubmit()) {
      let handler;
      // customIdの前方一致でハンドラを検索 (例: 'quest_accept_submit_12345')
      for (const [key, value] of client.modals) { 
        if (interaction.customId.startsWith(key)) {
          handler = value;
          break;
        }
      }

      if (handler) await handler.handle(interaction);
    }
  } catch (error) {
    let interactionDetails = 'Unknown Interaction';
    if (interaction.isCommand()) {
        interactionDetails = `Command: /${interaction.commandName}`;
    } else if (interaction.isButton() || interaction.isAnySelectMenu() || interaction.isModalSubmit()) {
        interactionDetails = `Component: ${interaction.customId}`;
    }

    // The handleInteractionError function will log the error AND reply to the user.
    await handleInteractionError({
        interaction,
        error,
        context: `Unhandled error in interactionCreate event for ${interactionDetails}`
    });
  }
});

// ✅ ChatGPT Auto-response on messageCreate
client.on('messageCreate', async message => {
  // Ignore messages from bots, and DMs
  if (message.author.bot || !message.guild) return;

  try {
    const config = await getGptConfig(message.guild.id);

    // Check if the channel is an auto-response channel and if the feature is enabled
    if (config.chat_gpt_channels && config.chat_gpt_channels.includes(message.channel.id)) {

      // Show a "typing..." indicator
      await message.channel.sendTyping();

      const userPrompt = message.content;
      const reply = await generateGptReply(message.guild.id, userPrompt);

      // Send the reply
      await message.reply({ content: reply, allowedMentions: { repliedUser: false } });
    }
  } catch (error) {
    // Do not send an error message to the channel to avoid spam.
    // Log the error for the administrator.
    console.error(`[❌エラー] ChatGPT自動応答エラー in guild ${message.guild.id}:`, error);
    await logError({
      client: message.client,
      guildId: message.guild.id,
      error,
      context: `ChatGPT自動応答 (Channel: #${message.channel.name})`,
    });
  }
});

// ✅ Botがサーバーから退出した際のデータクリーンアップ
client.on('guildDelete', async (guild) => {
  console.log(`Bot was removed from guild: ${guild.name} (${guild.id}). Cleaning up data...`);
  try {
    // quest_bot のデータを削除
    await require('./manager/questDataManager').deleteGuildData(guild.id);
    // TODO: chat_gpt_bot のデータも削除する処理を後で追加
    // await chatGptDataManager.deleteGuildData(guild.id);
  } catch (error) {
    console.error(`Failed to execute cleanup for guild ${guild.id}:`, error);
  }
});


// ✅ Bot起動時
client.once('ready', () => {
  console.log(`✅ Botが起動しました：${client.user.tag}`);

  // Start checking for expired quests every minute.
  setInterval(() => {
    checkAndCloseExpiredQuests(client);
  }, 60 * 1000); // 60000ms = 1 minute

  // 定時実行タスクを初期化
  initializeScheduler(client);
});

// ✅ Discordにログイン
client.login(process.env.DISCORD_TOKEN);
