// handlers/interactionLoader.js

const fs = require('fs');
const path = require('path');

function loadInteractions(client) {
  const botModules = fs.readdirSync(__dirname + '/../', { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name =>
      fs.existsSync(path.join(__dirname, '..', name, 'commands')) ||
      fs.existsSync(path.join(__dirname, '..', name, 'interactions'))
    );

  const interactionTypes = {
    buttons: client.buttons,
    selectMenus: client.selectMenus,
    modals: client.modals,
  };

  for (const moduleName of botModules) {
    const interactionsPath = path.join(__dirname, '..', moduleName, 'interactions');
    if (!fs.existsSync(interactionsPath)) continue;

    for (const [type, collection] of Object.entries(interactionTypes)) {
      const typePath = path.join(interactionsPath, type);
      if (!fs.existsSync(typePath)) continue;

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

module.exports = { loadInteractions };
