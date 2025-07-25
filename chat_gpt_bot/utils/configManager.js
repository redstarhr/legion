// e:/共有フォルダ/legion/chat_gpt_bot/utils/configManager.js
const configDataManager = require('../../../manager/configDataManager');

const CHAT_GPT_CONFIG_KEY = 'chatGptConfig';

/**
 * Retrieves the ChatGPT-specific configuration for a guild.
 * @param {string} guildId The ID of the guild.
 * @returns {Promise<object>} The ChatGPT configuration object.
 */
async function getChatGPTConfig(guildId) {
    const fullConfig = await configDataManager.getLegionConfig(guildId);
    return fullConfig[CHAT_GPT_CONFIG_KEY] || {};
}

/**
 * Updates and saves the ChatGPT-specific configuration for a guild.
 * @param {string} guildId The ID of the guild.
 * @param {object} updates The partial configuration updates.
 * @returns {Promise<object>} The newly updated ChatGPT configuration object.
 */
async function setChatGPTConfig(guildId, updates) {
    const currentGptConfig = await getChatGPTConfig(guildId);
    const newGptConfig = { ...currentGptConfig, ...updates };
    await configDataManager.saveLegionConfig(guildId, { [CHAT_GPT_CONFIG_KEY]: newGptConfig });
    return newGptConfig;
}

module.exports = { getChatGPTConfig, setChatGPTConfig };