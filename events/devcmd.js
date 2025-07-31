// events/devcmd.js - スラッシュコマンド登録モジュール

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const NC = '\x1b[0m';

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error(`${RED}❌ .envにDISCORD_TOKENとCLIENT_IDを設定してください${NC}`);
  process.exit(1);
}

async function registerCommands() {
  const commands = [];

  // モジュールのcommandsフォルダからコマンド収集
  const rootDir = path.join(__dirname, '..');
  const botModules = fs.readdirSync(rootDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => fs.existsSync(path.join(rootDir, name, 'commands')));

  console.log(`${YELLOW}🔄 ${botModules.length}個のモジュールを検出: [${botModules.join(', ')}]${NC}`);

  for (const moduleName of botModules) {
    const commandsPath = path.join(rootDir, moduleName, 'commands');
    if (!fs.existsSync(commandsPath)) continue;

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    if (commandFiles.length > 0) {
      console.log(`  📁 モジュール [${moduleName}] から ${commandFiles.length} 個のコマンドを検出。`);
    }

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      try {
        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
          commands.push(command.data.toJSON());
        } else {
          console.warn(`${YELLOW}[⚠️警告] スラッシュコマンド形式が不正: ${path.relative(__dirname, filePath)}${NC}`);
        }
      } catch (error) {
        console.error(`${RED}[❌エラー] コマンド読み込み失敗: ${path.relative(__dirname, filePath)}${NC}`, error);
      }
    }
  }

  console.log(`${GREEN}✅ 合計 ${commands.length} 個のコマンドを読み込みました。${NC}`);

  if (commands.length === 0) {
    console.log(`${YELLOW}⚠️ 登録するコマンドがありません。終了します。${NC}`);
    return;
  }

  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

  try {
    if (GUILD_ID) {
      console.log(`\n${YELLOW}🏠 ギルド(${GUILD_ID})に ${commands.length} 個のコマンドを登録します...${NC}`);
      const guildData = await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
      );
      console.log(`${GREEN}✅ ギルドコマンド ${guildData.length} 個を登録しました。（即時反映）${NC}`);
    } else {
      console.log(`${YELLOW}⚠️ GUILD_IDが設定されていません。ギルドコマンドの登録はスキップします。${NC}`);
    }

    console.log(`\n${YELLOW}🌍 グローバルコマンドとして ${commands.length} 個のコマンドを登録します...${NC}`);
    const globalData = await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log(`${GREEN}✅ グローバルコマンド ${globalData.length} 個を登録しました。（反映に最大1時間かかります）${NC}`);

  } catch (error) {
    console.error(`${RED}❌ Discord APIへのコマンド登録中にエラーが発生しました:${NC}`, error);
    throw error;
  }
}

module.exports = { registerCommands };
