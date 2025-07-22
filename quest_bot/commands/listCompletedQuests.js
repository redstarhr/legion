// commands/listCompletedQuests.js

const { SlashCommandBuilder } = require('discord.js');
const questDataManager = require('../utils/questDataManager');
const { generateCompletedQuestsView } = require('../utils/paginationUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('完了クエスト一覧')
    .setDescription('完了（アーカイブ）済みのクエストを一覧表示します。'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // Check if there are any completed quests first to avoid unnecessary view generation
    const allQuests = await questDataManager.getAllQuests(interaction.guildId);
    const completedQuests = Object.values(allQuests).filter(q => q.isArchived);
    if (completedQuests.length === 0) {
      return interaction.followUp({ content: '完了済みのクエストはありません。' });
    }

    const view = await generateCompletedQuestsView(interaction, 1);

    await interaction.followUp({
      ...view,
      ephemeral: true,
    });
  },
};