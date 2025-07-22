// utils/embeds.js

const { EmbedBuilder } = require('discord.js');
const questDataManager = require('./questDataManager');

/**
 * 受注状況を含めたEmbedを生成するヘルパー関数
 * @param {object} quest - クエストオブジェクト
 * @returns {EmbedBuilder}
 */
async function createQuestEmbed(quest) {
  const defaultTitle = '📜｜クエスト掲示板（LEGiON）';
  const archivedPrefix = '【完了】';

  // Set title, considering archived status and custom title
  let title = quest.title ? quest.title : defaultTitle;
  if (quest.isArchived) {
    title = `${archivedPrefix} ${title}`;
  }

  // サーバーに設定された色を取得します
  const embedColor = await questDataManager.getEmbedColor(quest.guildId);

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(quest.isArchived ? 0x95a5a6 : embedColor); // 完了時は灰色、それ以外は設定された色を使用

  // Set description if it exists
  if (quest.description) {
    embed.setDescription(quest.description);
  }

  // Add recruitment details as a field
  let recruitmentValue = `**組数**: ${quest.teams}\n**人数**: ${quest.people}`;
  if (quest.deadline) {
    recruitmentValue += `\n**期限**: ${quest.deadline}`;
  }
  embed.addFields({
    name: '募集内容',
    value: recruitmentValue,
    inline: false,
  });

  if (quest.accepted && quest.accepted.length > 0) {
    const acceptedList = quest.accepted
      .map(a => {
        let acceptanceString = `> ・${a.user} さんが \`${a.channelName}\` で ${a.teams}組/${a.people}人 受注`;
        if (a.comment) {
          acceptanceString += `\n> 💬 **コメント:** ${a.comment.replace(/\n/g, '\n> ')}`;
        }
        return acceptanceString;
      })
      .join('\n');
    embed.addFields({ name: '受注状況', value: acceptedList });
  }

  // Add footer with last update information
  if (quest.lastUpdatedAt && quest.lastUpdatedBy) {
    const timestamp = Math.floor(new Date(quest.lastUpdatedAt).getTime() / 1000);
    const footerText = `最終更新: ${quest.lastUpdatedBy.tag} | <t:${timestamp}:R>`;
    embed.setFooter({ text: footerText });
  }

  return embed;
}

module.exports = { createQuestEmbed };