// e:/共有フォルダ/legion/chat_gpt_bot/manager/gptManager.js
const { getChatGPTConfig } = require('../utils/configManager');

const MAX_HISTORY_MESSAGES = 10; // 遡る会話の最大数

/**
 * OpenAI APIにリクエストを送信するコア関数
 * @param {string} apiKey
 * @param {object} payload
 * @returns {Promise<string|null>}
 */
async function callOpenAI(apiKey, payload) {
  const url = 'https://api.openai.com/v1/chat/completions';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown API error' } }));
      console.error('OpenAI API Error:', errorData);
      throw new Error(errorData.error?.message || 'Unknown API error');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || null;
  }
}

/**
 * 会話の文脈を考慮して応答を生成する
 * @param {import('discord.js').Message} message
 * @param {import('discord.js').Client} client
 * @returns {Promise<string|null>}
 */
async function generateReply(message, client) {
  const guildId = message.guild.id;
  const config = await getChatGPTConfig(guildId);

  if (!config.apiKey) {
    throw new Error('APIキーが設定されていません。');
  }

  const messages = [{ role: 'system', content: config.systemPrompt || 'You are a helpful assistant.' }];

  const history = await message.channel.messages.fetch({ limit: MAX_HISTORY_MESSAGES, before: message.id });
  const conversationHistory = [];

  history.reverse().forEach(msg => {
    if (msg.author.id === client.user.id) {
      conversationHistory.push({ role: 'assistant', content: msg.content });
    } else if (!msg.author.bot) {
      conversationHistory.push({ role: 'user', content: msg.content });
    }
  });

  messages.push(...conversationHistory);
  messages.push({ role: 'user', content: message.content });

  const payload = {
    model: config.model || 'gpt-4o',
    messages: messages,
    temperature: config.temperature ?? 1.0,
  };

  return await callOpenAI(config.apiKey, payload);
}

/**
 * 単発のプロンプトに対して応答を生成する (会話履歴を考慮しない)
 * @param {string} guildId
 * @param {string} prompt
 * @returns {Promise<string|null>}
 */
async function generateOneOffReply(guildId, prompt) {
  const config = await getChatGPTConfig(guildId);
  if (!config.apiKey) {
    throw new Error('APIキーが設定されていません。');
  }

  const messages = [
    { role: 'system', content: config.systemPrompt || 'You are a helpful assistant.' },
    { role: 'user', content: prompt },
  ];

  const payload = {
    model: config.model || 'gpt-4o',
    messages: messages,
    temperature: config.temperature ?? 1.0,
  };

  return await callOpenAI(config.apiKey, payload);
}

module.exports = {
  generateReply,
  generateOneOffReply,
};