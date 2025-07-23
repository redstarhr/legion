// utils/logger.js

const { EmbedBuilder } = require('discord.js');
const { getLogChannel } = require('./questDataManager');

/**
 * アクションログを特定のチャンネルに送信する
 * @param {import('discord.js').Interaction} interaction - ログのトリガーとなったインタラクション
 * @param {object} logData - ログデータ
 * @param {string} logData.title - ログのタイトル
 * @param {import('discord.js').ColorResolvable} [logData.color='#2f3136'] - Embedの色
 * @param {string} [logData.description] - ログの詳細説明
 * @param {Object<string, string>} [logData.details] - Embedのフィールドに追加するキーと値のペア
 */
async function logAction(interaction, { title, color = '#2f3136', description, details = {} }) {
  const logChannelId = await getLogChannel(interaction.guildId);
  if (!logChannelId) return;

  try {
    const logChannel = await interaction.client.channels.fetch(logChannelId);
    if (!logChannel || !logChannel.isTextBased()) return;

    const logEmbed = new EmbedBuilder()
      .setTitle(title)
      .setColor(color)
      .setTimestamp();

    if (description) {
      logEmbed.setDescription(description);
    }

    const fields = [];
    // 実行者情報を追加。Botによる自動実行の場合はラベルを変更する。
    const executorLabel = interaction.user.bot ? 'システム' : '実行者';
    fields.push({
      name: executorLabel,
      value: `${interaction.user.tag} (${interaction.user.id})`,
      inline: true,
    });

    // detailsオブジェクトからフィールドを追加
    for (const [key, value] of Object.entries(details)) {
      if (value) { // 値が存在する場合のみ追加
        fields.push({ name: key, value: String(value), inline: true });
      }
    }

    logEmbed.addFields(fields);

    await logChannel.send({ embeds: [logEmbed] });
  } catch (error) {
    console.error(`[${interaction.guildId}] ログの送信に失敗しました:`, error);
  }
}

module.exports = { logAction };