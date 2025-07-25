// manager/gptManager.js
const axios = require('axios');

/**
 * OpenAI Chat API を呼び出して応答を取得します。
 * 
 * @param {Object} options 
 * @param {string} options.apiKey - OpenAI APIキー
 * @param {string} options.systemPrompt - システムプロンプト（省略可）
 * @param {string} options.userMessage - ユーザーからのメッセージ
 * @param {string} [options.model='gpt-3.5-turbo'] - モデル名（例：gpt-4）
 * @param {number} [options.temperature=1.0] - 生成温度（0.0〜2.0）
 * @param {number} [options.maxTokens=1000] - 最大トークン数（応答制限）
 * @returns {Promise<{ success: boolean, content?: string, error?: string }>}
 */
async function fetchChatGptReply({
    apiKey,
    systemPrompt = null,
    userMessage,
    model = 'gpt-3.5-turbo',
    temperature = 1.0,
    maxTokens = 1000
}) {
    if (!apiKey || !userMessage) {
        return { success: false, error: 'APIキーまたはユーザーメッセージが不足しています。' };
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };

    const messages = [];

    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: userMessage });

    const payload = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens
    };

    try {
        const res = await axios.post('https://api.openai.com/v1/chat/completions', payload, { headers });

        const reply = res.data.choices?.[0]?.message?.content?.trim();

        if (!reply) {
            return { success: false, error: 'ChatGPTの応答が空でした。' };
        }

        return { success: true, content: reply };
    } catch (error) {
        const errMsg = error?.response?.data?.error?.message || error.message || 'API呼び出し中に不明なエラーが発生しました。';
        return { success: false, error: errMsg };
    }
}

module.exports = {
    fetchChatGptReply,
};
