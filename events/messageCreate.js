// events/messageCreate.js

const { handleGptChat } = require('../chat_gpt_bot/utils/chatHandler');

module.exports = {
  name: 'messageCreate',
  execute(message, client) {
    handleGptChat(message, client);
  },
};
