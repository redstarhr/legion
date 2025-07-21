// index.js

require('dotenv').config(); // .envファイルを読み込む
const { Client, GatewayIntentBits, Collection, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { checkAndCloseExpiredQuests } = require('./quest_bot/utils/deadlineManager');

// Botクライアントを作成（必要なIntentを指定）
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// コマンド、ボタン、モーダル用のコレクションを用意
client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection(); // セレクトメニュー用のコレクションを追加
client.modals = new Collection();


// ✅ スラッシュコマンドの読み込み
const commandFiles = fs.readdirSync('./quest_bot/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const filePath = path.join(__dirname, 'quest_bot', 'commands', file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

// ✅ ボタンの読み込み
const buttonPath = path.join(__dirname, 'quest_bot', 'interactions', 'buttons');
const buttonFiles = fs.readdirSync(buttonPath).filter(file => file.endsWith('.js'));
for (const file of buttonFiles) {
  const button = require(path.join(buttonPath, file));
  client.buttons.set(button.customId, button);
}

// ✅ セレクトメニューの読み込み
const selectMenuPath = path.join(__dirname, 'quest_bot', 'interactions', 'selectMenus');
const selectMenuFiles = fs.readdirSync(selectMenuPath).filter(file => file.endsWith('.js'));
for (const file of selectMenuFiles) {
  const selectMenu = require(path.join(selectMenuPath, file));
  client.selectMenus.set(selectMenu.customId, selectMenu);
}

// ✅ モーダルの読み込み
const modalPath = path.join(__dirname, 'quest_bot', 'interactions', 'modals');
const modalFiles = fs.readdirSync(modalPath).filter(file => file.endsWith('.js'));
for (const file of modalFiles) {
  const modal = require(path.join(modalPath, file));
  client.modals.set(modal.customId, modal);
}


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
    } else if (interaction.isStringSelectMenu()) {
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
    console.error('❌ エラー:', error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '⚠️ エラーが発生しました。', flags: [MessageFlags.Ephemeral] });
    } else {
      await interaction.reply({ content: '⚠️ エラーが発生しました。', flags: [MessageFlags.Ephemeral] });
    }
  }
});


// ✅ Bot起動時
client.once('ready', () => {
  console.log(`✅ Botが起動しました：${client.user.tag}`);

  // Start checking for expired quests every minute.
  setInterval(() => {
    checkAndCloseExpiredQuests(client);
  }, 60 * 1000); // 60000ms = 1 minute
});

// ✅ Discordにログイン
client.login(process.env.DISCORD_TOKEN);
