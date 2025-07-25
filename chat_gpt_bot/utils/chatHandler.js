// e:/共有フォルダ/legion/chat_gpt_bot/utils/chatHandler.js
const { getChatGPTConfig } = require('./configManager');
const { generateReply } = require('../manager/gptManager'); // API通信用の新しいマネージャー
const { logError } = require('../../utils/errorLogger');

/**
 * Handles incoming messages to determine if a ChatGPT response is needed.
 * @param {import('discord.js').Message} message
 * @param {import('discord.js').Client} client
 */
async function handleGptChat(message, client) {
    // ボットからのメッセージ、DMは無視
    if (message.author.bot || !message.guild) return;

    const gptConfig = await getChatGPTConfig(message.guild.id);
    const allowedChannels = gptConfig.allowedChannels || [];

    // 設定されたチャンネル以外、またはAPIキーがなければ何もしない
    if (!allowedChannels.includes(message.channel.id) || !process.env.OPENAI_API_KEY) {
        return;
    }

    try {
        // "typing..."インジケーターを表示
        await message.channel.sendTyping();

        const userPrompt = message.content;
        const reply = await generateReply(message.guild.id, userPrompt);

        // 2000文字を超える場合は分割して送信
        if (reply.length > 2000) {
            const chunks = reply.match(/.{1,2000}/gs) || [];
            for (const chunk of chunks) {
                await message.reply({ content: chunk, allowedMentions: { repliedUser: false } });
            }
        } else {
            await message.reply({ content: reply, allowedMentions: { repliedUser: false } });
        }
    } catch (error) {
        // ユーザーにはエラーを返さず、管理者向けのログに記録する
        console.error(`[ChatGPT] 自動応答エラー (Guild: ${message.guild.id}, Channel: #${message.channel.name}):`, error);
        await logError({
            client,
            error,
            context: `ChatGPT自動応答 (Channel: #${message.channel.name})`,
            guildId: message.guild.id,
        });
    }
}

module.exports = { handleGptChat };