// devcmdup.js - スラッシュコマンド登録用スクリリプト
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

// --- 定数 ---
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const NC = '\x1b[0m'; // No Color

// --- 環境変数チェック ---
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error(`${RED}❌ エラー: .envファイルに DISCORD_TOKEN と CLIENT_ID を設定してください。${NC}`);
  process.exit(1);
}

/**
 * メインのデプロイ処理
 */
async function main() {
  const commands = [];
  // プロジェクトの構成に合わせてパスを修正
  const commandsPath = path.join(__dirname, 'quest_bot', 'commands');

  if (!fs.existsSync(commandsPath)) {
    console.error(`${RED}❌ エラー: 'commands' ディレクトリが見つかりません。${NC}`);
    process.exit(1);
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  console.log(`${YELLOW}🔍 コマンドファイルを読み込んでいます...${NC}`);

  // --- コマンドの読み込みとデータ整形 ---
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      // 開発中にファイルを変更した場合でも最新版を読み込むためにキャッシュをクリア
      delete require.cache[require.resolve(filePath)];
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
      } else {
        console.warn(`${YELLOW}[⚠️警告] スラッシュコマンドの形式が不正です: ${path.relative(__dirname, filePath)}${NC}`);
      }
    } catch (error) {
      console.error(`${RED}[❌エラー] コマンドの読み込みに失敗しました: ${path.relative(__dirname, filePath)}${NC}`, error);
    }
  }
  console.log(`${GREEN}✅ 合計 ${commands.length} 個のコマンドを読み込みました。${NC}`);

  if (commands.length === 0) {
    console.log(`${YELLOW}⚠️ 登録するコマンドがありません。処理を終了します。${NC}`);
    return;
  }

  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  const deployGlobal = process.argv.includes('--global');

  // --- デプロイ処理 ---
  try {
    if (deployGlobal) {
      // --- グローバルコマンドとして登録 ---
      console.log(`\n${YELLOW}🌍 グローバルコマンドとして ${commands.length} 個のコマンドを登録します...${NC}`);
      const data = await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands },
      );
      console.log(`${GREEN}✅ ${data.length} 個のグローバルコマンドを登録しました。（反映に最大1時間かかります）${NC}`);
    } else {
      // --- ギルドコマンドとして登録 ---
      if (!GUILD_ID) {
        console.error(`${RED}❌ エラー: ギルドコマンドを登録するには .env ファイルに GUILD_ID を設定してください。${NC}`);
        console.log('💡 グローバルに登録する場合は `node devcmdup.js --global` を実行してください。');
        process.exit(1);
      }
      console.log(`\n${YELLOW}🏠 ギルド(${GUILD_ID})に ${commands.length} 個のコマンドを登録します...${NC}`);
      const data = await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands },
      );
      console.log(`${GREEN}✅ ${data.length} 個のギルドコマンドを登録しました。（即時反映）${NC}`);
    }
  } catch (error) {
    console.error(`${RED}❌ Discord APIへのコマンド登録中にエラーが発生しました:${NC}`, error);
    process.exit(1);
  }
}

// --- スクリプト実行 ---
main().catch(error => {
  // このcatchは、main()内の予期せぬ同期的なエラー（APIコール以外）を捕捉します。
  console.error(`${RED}❌ コマンド登録プロセスで予期せぬエラーが発生しました:${NC}`, error);
  process.exit(1);
});
