const axios = require('axios');

/**
 * OpenAI Chat API を呼び出して応答を取得します。
 * 
 * @param {Object} options 
 * @param {string} options.apiKey
 * @param {string} options.systemPrompt
 * @param {string} options.userMessage
 * @param {string} [options.model='gpt-3.5-turbo']
 * @param {number} [options.temperature=1.0]
 * @param {number} [options.maxTokens=1000]
 * @returns {Promise<{ success: boolean, content?: string, error?: string, usage?: object }>}
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

    if (!apiKey.startsWith('sk-')) {
        return { success: false, error: 'APIキーの形式が正しくありません。' };
    }

    if (typeof temperature !== 'number' || temperature < 0 || temperature > 2) {
        return { success: false, error: 'temperature は 0〜2 の範囲で指定してください。' };
    }

    if (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 4096) {
        return { success: false, error: 'maxTokens は 1〜4096 の範囲で指定してください。' };
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };

    const messages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }]
        : [{ role: 'user', content: userMessage }];

    const payload = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens
    };

    try {
        const res = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
            headers,
            timeout: 15000,
        });

        const reply = res.data.choices?.[0]?.message?.content?.trim();

        if (!reply) {
            return { success: false, error: 'ChatGPTの応答が空でした。' };
        }

        return {
            success: true,
            content: reply,
            usage: res.data.usage
        };
    } catch (error) {
        const openAiError = error?.response?.data?.error;
        const errMsg = openAiError?.message || error.message || 'API呼び出し中に不明なエラーが発生しました。';
        const errType = openAiError?.type;
        const errCode = openAiError?.code;

        return {
            success: false,
            error: `[${errType ?? 'Unknown'}] ${errMsg}${errCode ? ` (code: ${errCode})` : ''}`
        };
    }
}

module.exports = {
    fetchChatGptReply,
};
