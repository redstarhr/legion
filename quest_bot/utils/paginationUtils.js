// utils/paginationUtils.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const questDataManager = require('./questDataManager');

const QUESTS_PER_PAGE = 5;

function generateCompletedQuestsEmbed(page, totalPages, questsOnPage, guildId) {
  const embed = new EmbedBuilder()
    .setTitle('📁 完了済みクエスト一覧')
    .setColor(0x95a5a6)
    .setFooter({ text: `ページ ${page} / ${totalPages}` });

  if (questsOnPage.length === 0) {
    embed.setDescription('このページに表示するクエストはありません。');
  } else {
    const questList = questsOnPage.map(quest => {
      const title = quest.name || `無題のクエスト`;
      const completedDate = quest.completedAt ? `<t:${Math.floor(new Date(quest.completedAt).getTime() / 1000)}:f>` : '不明';

      const failedParticipants = quest.accepted?.filter(a => a.status === 'failed');
      let resultText = `> 完了日時: ${completedDate}\n> ID: \`${quest.id}\``;

      if (failedParticipants && failedParticipants.length > 0) {
          const failedList = failedParticipants.map(p => `>   - ${p.userTag} (${p.teams}組/${p.players}人)`).join('\n');
          resultText += `\n> **失敗した参加者:**\n${failedList}`;
      }
      return `**${title}**\n${resultText}`;
    }).join('\n\n');
    embed.setDescription(questList);
  }
  return embed;
}

function generateUnarchiveSelectMenu(questsOnPage, userId) {
  if (!questsOnPage || questsOnPage.length === 0) {
    return null;
  }

  const options = questsOnPage.map(quest => {
    const title = quest.name || `無題のクエスト`;
    // Discordのラベル文字数制限(100)を考慮
    const truncatedTitle = title.length > 80 ? `${title.substring(0, 77)}...` : title;
    return {
      label: truncatedTitle,
      description: `ID: ${quest.id}`,
      value: quest.id,
    };
  });

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`unarchive_select_${userId}`)
      .setPlaceholder('完了状態から戻すクエストを選択...')
      .addOptions(options)
  );
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

/**
 * Generates the full view (embeds and components) for the completed quests list.
 * @param {import('discord.js').Interaction} interaction
 * @param {number} page The page number to display.
 * @returns {Promise<{embeds: import('discord.js').EmbedBuilder[], components: import('discord.js').ActionRowBuilder[]}>}
 */
async function generateCompletedQuestsView(interaction, page) {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  // Fetch and sort data
  const allQuests = await questDataManager.getAllQuests(guildId);
  const completedQuests = Object.values(allQuests)
    .filter(q => q.isArchived)
    .sort((a, b) => (new Date(b.completedAt) || 0) - (new Date(a.completedAt) || 0));

  const totalPages = Math.ceil(completedQuests.length / QUESTS_PER_PAGE) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages)); // Ensure page is within bounds

  const start = (currentPage - 1) * QUESTS_PER_PAGE;
  const questsOnPage = completedQuests.slice(start, start + QUESTS_PER_PAGE);

  // Generate components
  const embed = generateCompletedQuestsEmbed(currentPage, totalPages, questsOnPage, guildId);
  const components = [];
  const selectMenu = generateUnarchiveSelectMenu(questsOnPage, userId);
  if (selectMenu) {
    components.push(selectMenu);
  }
  const paginationButtons = generatePaginationButtons(currentPage, totalPages, userId);
  components.push(paginationButtons);

  return { embeds: [embed], components };
}

module.exports = { generateCompletedQuestsEmbed, generatePaginationButtons, generateUnarchiveSelectMenu, QUESTS_PER_PAGE, generateCompletedQuestsView };