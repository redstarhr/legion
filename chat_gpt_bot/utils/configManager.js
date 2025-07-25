// chat_gpt_bot/utils/configManager.js

const { getLegionConfig, saveLegionConfig } = require('../../manager/configDataManager');

const CHAT_GPT_CONFIG_KEY = 'chatGptConfig';

const defaultChatGptConfig = {
  apiKey: '',
  systemPrompt: '',
  temperature: 1.0,
  model: 'gpt-4o',
  today_gpt_channel_id: '',
  allowedChannels: [],
};

function sanitizeConfig(config) {
  return Object.fromEntries(
    Object.entries(config).filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        !(Array.isArray(value) && value.length === 0)
    )
  );
}

async function getChatGPTConfig(guildId) {
  const fullConfig = await getLegionConfig(guildId);
  const rawConfig = fullConfig[CHAT_GPT_CONFIG_KEY] || {};
  return {
    ...defaultChatGptConfig,
    ...rawConfig,
    // Ensure allowedChannels is always an array
    allowedChannels: Array.isArray(rawConfig.allowedChannels)
      ? rawConfig.allowedChannels
      : [],
  };
}

async function setChatGPTConfig(guildId, updates) {
  const currentGptConfig = await getChatGPTConfig(guildId);
  const merged = { ...currentGptConfig, ...updates };
  const sanitized = sanitizeConfig(merged);

  await saveLegionConfig(guildId, {
    [CHAT_GPT_CONFIG_KEY]: sanitized,
  });

  return sanitized;
}

module.exports = {
  getChatGPTConfig,
  setChatGPTConfig,
  defaultChatGptConfig,
};
