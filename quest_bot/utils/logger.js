// utils/logger.js

const { EmbedBuilder } = require('discord.js');
const { getLogChannel } = require('../../manager/configDataManager');

/**
 * アクションログを特定のチャンネルに送信する
 * @param {object} context - ログのコンテキスト
 * @param {import('discord.js').Client} context.client - Discord Client
 * @param {string} context.guildId - ギルドID
 * @param {import('discord.js').User} context.user - 実行者 (システムの場合はBotのUser)
 * @param {object} logData - ログデータ
 * @param {string} logData.title - ログのタイトル
 * @param {import('discord.js').ColorResolvable} [logData.color='#2f3136'] - Embedの色
 * @param {string} [logData.description] - ログの詳細説明
 * @param {Object<string, string>} [logData.details] - Embedのフィールドに追加するキーと値のペア
 */
async function logAction({ client, guildId, user }, { title, color = '#2f3136', description, details = {} }) {
  if (!client || !guildId || !user) {
    console.error('[Logger] Invalid context provided to logAction. Missing client, guildId, or user.');
    return;
  }
  const logChannelId = await getLogChannel(guildId);
  if (!logChannelId) return;

  try {
    const logChannel = await client.channels.fetch(logChannelId);
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
    const executorLabel = user.bot ? 'システム' : '実行者';
    fields.push({
      name: executorLabel,
      value: `${user.tag} (${user.id})`,
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
    console.error(`[${guildId}] ログの送信に失敗しました:`, error);
  }
}

module.exports = { logAction };