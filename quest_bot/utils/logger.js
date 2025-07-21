// utils/logger.js

const { EmbedBuilder } = require('discord.js');
const { getLogChannel } = require('./questDataManager');

/**
 * アクションログを特定のチャンネルに送信する
 * @param {import('discord.js').Interaction} interaction - ログのトリガーとなったインタラクション
 * @param {string} title - ログのタイトル
 * @param {string} description - ログの詳細
 * @param {import('discord.js').ColorResolvable} [color='#2f3136'] - Embedの色
 */
async function logAction(interaction, title, description, color = '#2f3136') {
  const logChannelId = getLogChannel(interaction.guildId);
  if (!logChannelId) return;

  try {
    const logChannel = await interaction.client.channels.fetch(logChannelId);
    if (!logChannel || !logChannel.isTextBased()) return;

    const logEmbed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .addFields({
        name: '実行者',
        value: `${interaction.user.tag} (${interaction.user.id})`,
        inline: true,
      })
      .setTimestamp();

    await logChannel.send({ embeds: [logEmbed] });
  } catch (error) {
    console.error(`[${interaction.guildId}] ログの送信に失敗しました:`, error);
  }
}

module.exports = { logAction };