// chat_gpt/manager/chatGptManager.js
const fs = require('fs/promises');
const path =require('path');
const OpenAI = require('openai');

const DATA_DIR = path.join(__dirname, '../../../data-legion/chat_gpt');

// デフォルト設定
const defaultConfig = {
    apiKey: null,
    persona: '親切なアシスタント',
    area: '日本',
    maxTokens: 300,
};

/**
 * ギルドごとの設定ディレクトリが存在することを保証します。
 * @param {string} guildId
 */
async function ensureGuildDir(guildId) {
    await fs.mkdir(path.join(DATA_DIR, guildId), { recursive: true });
}

/**
 * ギルドのChatGPT設定を取得します。
 * @param {string} guildId
 * @returns {Promise<object>}
 */
async function getConfig(guildId) {
    const configPath = path.join(DATA_DIR, guildId, 'config.json');
    try {
        const json = await fs.readFile(configPath, 'utf-8');
        return { ...defaultConfig, ...JSON.parse(json) };
    } catch (error) {
        if (error.code === 'ENOENT') {
            return { ...defaultConfig }; // ファイルが存在しない場合はデフォルトを返す
        }
        throw error; // その他のエラーは再スロー
    }
}

/**
 * ギルドのChatGPT設定を保存します。
 * @param {string} guildId
 * @param {object} configData
 */
async function setConfig(guildId, configData) {
    await ensureGuildDir(guildId);
    const configPath = path.join(DATA_DIR, guildId, 'config.json');
    const currentConfig = await getConfig(guildId);
    const newConfig = { ...currentConfig, ...configData };
    await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2));
    return newConfig;
}

/**
 * ChatGPT APIを使用して応答を生成します。
 * @param {string} guildId
 * @param {string} userPrompt
 * @returns {Promise<string>}
 */
async function generateReply(guildId, userPrompt) {
    const config = await getConfig(guildId);

    if (!config.apiKey) {
        throw new Error('APIキーが設定されていません。設定コマンドで設定してください。');
    }

    const openai = new OpenAI({ apiKey: config.apiKey });

    const messages = [
        { role: 'system', content: `あなたは${config.area}に関する知識を持つ「${config.persona}」というキャラクターです。親しみやすく返答してください。` },
        { role: 'user', content: userPrompt }
    ];

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4', // 必要に応じてモデルを変更
            messages,
            max_tokens: Number(config.maxTokens) || 300,
            temperature: 0.8,
        });
        return response.choices[0].message.content.trim();
    } catch (error) {
        if (error.status === 401) throw new Error('OpenAI APIキーが無効です。設定を確認してください。');
        if (error.status === 429) throw new Error('APIの利用制限に達しました。時間をおいて再度お試しください。');
        throw error; // その他のAPIエラーはそのまま投げる
    }
}

module.exports = { getConfig, setConfig, generateReply };