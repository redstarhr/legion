// commands/listCompletedQuests.js

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const questDataManager = require('../utils/questDataManager');
const { generateCompletedQuestsView } = require('../utils/paginationUtils');
const { handleInteractionError } = require('../../utils/interactionErrorLogger');

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
      await handleInteractionError({ interaction, error, context: '完了クエスト一覧表示' });
    }
  },
};