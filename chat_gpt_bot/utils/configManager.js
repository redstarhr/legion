'use strict';

const { getLegionConfig, saveLegionConfig } = require('../../manager/configDataManager');

/**
 * ギルドのChatGPT関連設定を取得します。
 * @param {string} guildId
 * @returns {Promise<object>} ChatGPT設定オブジェクト
 */
async function getChatGPTConfig(guildId) {
  const config = await getLegionConfig(guildId);
  // chat_gpt_botモジュールに関連する設定を抽出し、デフォルト値を設定
  return {
    apiKey: config.chatGptApiKey || process.env.OPENAI_API_KEY || null,
    systemPrompt: config.chatGptSystemPrompt || 'You are a helpful assistant.',
    temperature: config.chatGptTemperature, // Can be null/undefined, handled by gptManager
    model: config.chatGptModel || 'gpt-4o',
    today_gpt_channel_id: config.todayGptChannelId || null,
    allowedChannels: config.chatGptAllowedChannels || [],
    maxTokens: config.chatGptMaxTokens, // Can be null/undefined
  };
}

/**
 * ギルドのChatGPT関連設定を保存します。
 * @param {string} guildId
 * @param {object} updates - 保存する設定のキーと値のオブジェクト
 * @returns {Promise<object>} 更新後の完全なギルド設定オブジェクト
 */
async function setChatGPTConfig(guildId, updates) {
  // configDataManagerで使われているキー名に変換する
  const updatesToSave = {};
  if (updates.apiKey !== undefined) updatesToSave.chatGptApiKey = updates.apiKey;
  if (updates.systemPrompt !== undefined) updatesToSave.chatGptSystemPrompt = updates.systemPrompt;
  if (updates.temperature !== undefined) updatesToSave.chatGptTemperature = updates.temperature;
  if (updates.model !== undefined) updatesToSave.chatGptModel = updates.model;
  if (updates.maxTokens !== undefined) updatesToSave.chatGptMaxTokens = updates.maxTokens;
  if (updates.today_gpt_channel_id !== undefined) updatesToSave.todayGptChannelId = updates.today_gpt_channel_id;
  if (updates.allowedChannels !== undefined) updatesToSave.chatGptAllowedChannels = updates.allowedChannels;

  return await saveLegionConfig(guildId, updatesToSave);
}

module.exports = {
  getChatGPTConfig,
  setChatGPTConfig,
};