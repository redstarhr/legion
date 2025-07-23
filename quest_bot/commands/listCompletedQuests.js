// commands/listCompletedQuests.js

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const questDataManager = require('../utils/questDataManager');
const { generateCompletedQuestsView } = require('../utils/paginationUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('完了クエスト一覧')
    .setDescription('完了（アーカイブ）済みのクエストを一覧表示します。'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Check if there are any completed quests first to avoid unnecessary view generation
      const allQuests = await questDataManager.getAllQuests(interaction.guildId);
      const completedQuests = Object.values(allQuests).filter(q => q.isArchived);
      if (completedQuests.length === 0) {
        return interaction.editReply({ content: '完了済みのクエストはありません。' });
      }

      const view = await generateCompletedQuestsView(interaction, 1);

      await interaction.editReply(view);
    } catch (error) {
      console.error('完了クエスト一覧の表示中にエラーが発生しました:', error);
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: 'エラーが発生したため、一覧を表示できませんでした。' }).catch(console.error);
      } else {
        await interaction.reply({ content: 'エラーが発生したため、一覧を表示できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
      }
    }
  },
};