// e:/共有フォルダ/legion/chat_gpt_bot/utils/chatHandler.js
const { getChatGPTConfig } = require('../utils/configManager');
const { generateReply } = require('../manager/gptManager');
const { logError } = require('../../utils/errorLogger');

/**
 * Handles incoming messages to determine if a ChatGPT response is needed.
 * @param {import('discord.js').Message} message
 * @param {import('discord.js').Client} client
 */
async function handleGptChat(message, client) {
    try {
        if (message.author.bot || !message.guild) return;

        const gptConfig = await getChatGPTConfig(message.guild.id);

        // ボットが応答すべきか判断する
        const isMentioned = message.mentions.has(client.user.id);
        const isInAutoChannel = gptConfig.allowedChannels?.includes(message.channel.id);

        // 自動応答チャンネルでなく、かつメンションもされていない場合は無視
        if (!isInAutoChannel && !isMentioned) return;

        if (!gptConfig.apiKey) {
            return; // APIキーがなければ静かに無視
        }

        await message.channel.sendTyping();

        const reply = await generateReply(message, client);

        if (reply) {
            for (let i = 0; i < reply.length; i += 2000) {
                const chunk = reply.substring(i, i + 2000);
                if (i === 0) {
                    await message.reply({ content: chunk, allowedMentions: { repliedUser: false } });
                } else {
                    await message.channel.send(chunk);
                }
            }
        }
    } catch (error) {
        console.error(`[ChatGPT] 自動応答エラー (Guild: ${message.guild.id}, Channel: #${message.channel.name}):`, error);
        await logError({ client, error, context: `ChatGPT自動応答 (Channel: #${message.channel.name})`, guildId: message.guild.id });
        await message.reply({ content: '🤖 エラーが発生したため、応答できませんでした。' }).catch(() => {});
    }
}

module.exports = {
  handleGptChat,
};