// utils/configManager.js

const configDataManager = require('../../manager/configDataManager');

const CHAT_GPT_CONFIG_KEY = 'chatGptConfig';

/**
 * デフォルト設定（必要に応じて拡張可）
 */
const defaultChatGptConfig = {
  apiKey: '',
  systemPrompt: '',
  temperature: 1.0,
  model: 'gpt-4o',
  todayChannelId: '',
};

/**
 * 無効なプロパティを除外
 * @param {object} config 
 * @returns {object}
 */
function sanitizeConfig(config) {
  return Object.fromEntries(
    Object.entries(config).filter(
      ([, value]) => value !== null && value !== undefined
    )
  );
}

/**
 * 指定されたギルドの ChatGPT 設定を取得
 * @param {string} guildId
 * @returns {Promise<object>} ChatGPT設定オブジェクト
 */
async function getChatGPTConfig(guildId) {
  const fullConfig = await configDataManager.getLegionConfig(guildId);
  return fullConfig[CHAT_GPT_CONFIG_KEY] || { ...defaultChatGptConfig };
}

/**
 * 指定されたギルドの ChatGPT 設定を更新・保存
 * null/undefined の値は削除
 * @param {string} guildId
 * @param {object} updates
 * @returns {Promise<object>} 更新後の設定
 */
async function setChatGPTConfig(guildId, updates) {
  const currentGptConfig = await getChatGPTConfig(guildId);
  const merged = { ...currentGptConfig, ...updates };
  const sanitized = sanitizeConfig(merged);

  await configDataManager.saveLegionConfig(guildId, {
    [CHAT_GPT_CONFIG_KEY]: sanitized,
  });

  return sanitized;
}

module.exports = {
  getChatGPTConfig,
  setChatGPTConfig,
  defaultChatGptConfig,
};
