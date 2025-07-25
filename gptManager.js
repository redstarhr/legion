// e:/共有フォルダ/legion/chat_gpt_bot/manager/gptManager.js
const OpenAI = require('openai');
const { getChatGPTConfig } = require('../utils/configManager');

/**
 * Generates a reply using the OpenAI API based on guild-specific settings.
 * @param {string} guildId The ID of the guild.
 * @param {string} userPrompt The user's message content.
 * @returns {Promise<string>} The generated reply from ChatGPT.
 */
async function generateReply(guildId, userPrompt) {
    const config = await getChatGPTConfig(guildId);
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OpenAI APIキーがサーバー環境変数に設定されていません。');
    }

    const openai = new OpenAI({ apiKey });

    const messages = [];
    if (config.systemPrompt) {
        messages.push({ role: 'system', content: config.systemPrompt });
    }
    messages.push({ role: 'user', content: userPrompt });

    try {
        const response = await openai.chat.completions.create({
            model: config.model || 'gpt-4-turbo',
            messages,
            temperature: config.temperature ?? 1.0,
        });
        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw new Error(`OpenAI APIとの通信に失敗しました: ${error.message}`);
    }
}

module.exports = { generateReply };