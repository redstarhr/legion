// handllers/commandLoader.js

const fs = require('fs');
const path = require('path');

function loadCommands(client) {
  const botModules = fs.readdirSync(__dirname + '/../', { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name =>
      fs.existsSync(path.join(__dirname, '..', name, 'commands')) ||
      fs.existsSync(path.join(__dirname, '..', name, 'interactions'))
    );

  console.log(`🔄 ${botModules.length}個のモジュールを検出: [${botModules.join(', ')}]`);

  for (const moduleName of botModules) {
    const commandsPath = path.join(__dirname, '..', moduleName, 'commands');
    if (fs.existsSync(commandsPath)) {
      const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
      for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if (command?.data && command?.execute) {
          client.commands.set(command.data.name, command);
        } else {
          console.warn(`⚠️ 不正なコマンド: ${file}`);
        }
      }
    }
  }
}

module.exports = { loadCommands };
