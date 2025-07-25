// utils/chatHandler.js
const { getChatGPTConfig } = require('./configManager');
const { generateReply } = require('../../manager/gptManager');
const { logError } = require('../../utils/errorLogger');

/**
 * DiscordのメッセージにChatGPT応答を返す処理
 * @param {import('discord.js').Message} message
 * @param {import('discord.js').Client} client
 */
async function handleGptChat(message, client) {
  try {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const channelId = message.channel.id;

    const gptConfig = await getChatGPTConfig(guildId);

    // 応答対象チャンネル判定
    if (!Array.isArray(gptConfig.chat_gpt_channels) || !gptConfig.chat_gpt_channels.includes(channelId)) {
      return;
    }

    // Botへのメンション、または返信されているか
    const isMentioned = message.mentions.has(client.user.id);
    let isReplyToBot = false;
    if (message.reference) {
      try {
        const referencedMessage = await message.fetchReference();
        isReplyToBot = referencedMessage.author.id === client.user.id;
      } catch (err) {
        // 無効な参照は無視（削除済みなど）
      }
    }

    if (!isMentioned && !isReplyToBot) return;

    // APIキー未設定ならスキップ
    if (!gptConfig.apiKey) return;

    await message.channel.sendTyping();

    const reply = await generateReply(message, client);

    if (reply) {
      const chunks = splitMessage(reply);
      for (let i = 0; i < chunks.length; i++) {
        const content = chunks[i];
        if (i === 0) {
          await message.reply({ content, allowedMentions: { repliedUser: false } });
        } else {
          await message.channel.send(content);
        }
      }
    }

  } catch (error) {
    console.error(`[ChatGPT] 自動応答エラー (Guild: ${message.guild?.id}, Channel: #${message.channel?.name}):`, error);

    await logError({
      client,
      error,
      context: `ChatGPT自動応答 (Guild: ${message.guild?.id}, Channel: #${message.channel?.name})`,
      guildId: message.guild?.id,
    });

    await message.reply({ content: '🤖 エラーが発生したため、応答できませんでした。' }).catch(() => {});
  }
}

/**
 * 長文を Discord の制限（2000文字）で分割
 * @param {string} text
 * @returns {string[]}
 */
function splitMessage(text) {
  const maxLength = 2000;
  const chunks = [];

  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.substring(i, i + maxLength));
  }

  return chunks;
}

module.exports = { handleGptChat };
