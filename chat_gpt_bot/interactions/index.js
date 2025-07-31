// chat_gpt_bot/interactions/index.js

const fs = require('fs');
const path = require('path');

function loadInteractionHandlers(type) {
  const dirPath = path.join(__dirname, type);
  const handlers = new Map();

  if (!fs.existsSync(dirPath)) return handlers;

  const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.js'));
  for (const file of files) {
    const handler = require(path.join(dirPath, file));
    if (handler?.customId && typeof handler.handle === 'function') {
      handlers.set(handler.customId, handler);
    } else {
      console.warn(`⚠️ 不正なインタラクション: ${type}/${file}`);
    }
  }
  return handlers;
}

const buttons = loadInteractionHandlers('buttons');
const selectMenus = loadInteractionHandlers('selectMenus');
const modals = loadInteractionHandlers('modals');

module.exports = {
  buttons,
  selectMenus,
  modals,
};
