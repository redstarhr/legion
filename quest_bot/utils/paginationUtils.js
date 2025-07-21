// utils/paginationUtils.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const QUESTS_PER_PAGE = 5;

function generateCompletedQuestsEmbed(page, totalPages, questsOnPage, guildId) {
  const embed = new EmbedBuilder()
    .setTitle('📁 完了済みクエスト一覧')
    .setColor(0x95a5a6)
    .setFooter({ text: `ページ ${page} / ${totalPages}` });

  if (questsOnPage.length === 0) {
    embed.setDescription('このページに表示するクエストはありません。');
  } else {
    questsOnPage.forEach(quest => {
      const title = quest.title || `クエスト (ID: ${quest.messageId.slice(0, 8)}...)`;
      const questUrl = `https://discord.com/channels/${guildId}/${quest.channelId}/${quest.messageId}`;
      const description = `元の掲示板へ`;
      embed.addFields({ name: title, value: description });
    });
  }
  return embed;
}

function generatePaginationButtons(page, totalPages, userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`pagination_list-completed_prev_${userId}`)
      .setLabel('◀️ 前へ')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === 1),
    new ButtonBuilder()
      .setCustomId(`pagination_list-completed_next_${userId}`)
      .setLabel('次へ ▶️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === totalPages)
  );
}

module.exports = { generateCompletedQuestsEmbed, generatePaginationButtons, QUESTS_PER_PAGE };