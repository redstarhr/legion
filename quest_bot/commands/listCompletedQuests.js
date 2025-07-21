// commands/listCompletedQuests.js

const { SlashCommandBuilder } = require('discord.js');
const questDataManager = require('../utils/questDataManager');
const { generateCompletedQuestsEmbed, generatePaginationButtons, QUESTS_PER_PAGE } = require('../utils/paginationUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('完了クエスト一覧')
    .setDescription('完了（アーカイブ）済みのクエストを一覧表示します。'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const allQuests = await questDataManager.getAllQuests(interaction.guildId);
    const completedQuests = Object.values(allQuests).filter(q => q.isArchived);

    if (completedQuests.length === 0) {
      return interaction.followUp({ content: '完了済みのクエストはありません。' });
    }

    // 完了日時が新しい順にソート
    completedQuests.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const guildId = interaction.guildId;
    const totalPages = Math.ceil(completedQuests.length / QUESTS_PER_PAGE);
    const questsOnFirstPage = completedQuests.slice(0, QUESTS_PER_PAGE);

    const embed = generateCompletedQuestsEmbed(1, totalPages, questsOnFirstPage, guildId);
    const buttons = generatePaginationButtons(1, totalPages, interaction.user.id);

    await interaction.followUp({
      embeds: [embed],
      components: [buttons],
      ephemeral: true,
    });
  },
};