// chat_gpt_bot/utils/configManager.js
const path = require('path');
const { ensureGuildJSON, readJSON, writeJSON } = require('../../utils/fileHelper');

const CHAT_GPT_CONFIG_FILENAME = 'kyou_chat_gpt.json';

const defaultChatGptConfig = {
  apiKey: '',
  systemPrompt: '',
  temperature: 1.0,
  model: 'gpt-4o',
  allowedChannels: [],
};

function getConfigPath(guildId) {
  return path.join(__dirname, '../../data-legion/chat_gpt', guildId, CHAT_GPT_CONFIG_FILENAME);
}

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

function getChatGPTConfig(guildId) {
  const configPath = getConfigPath(guildId);
  ensureGuildJSON(configPath, defaultChatGptConfig);
  const data = readJSON(configPath);
  return {
    ...defaultChatGptConfig,
    ...data,
    allowedChannels: Array.isArray(data.allowedChannels) ? data.allowedChannels : [],
  };
}

function setChatGPTConfig(guildId, updates) {
  const configPath = getConfigPath(guildId);
  ensureGuildJSON(configPath, defaultChatGptConfig);
  const current = readJSON(configPath);
  const merged = { ...current, ...updates };
  const sanitized = sanitizeConfig(merged);
  writeJSON(configPath, sanitized);
  return sanitized;
}

module.exports = {
  getChatGPTConfig,
  setChatGPTConfig,
  defaultChatGptConfig,
};
