// commands/listCompletedQuests.js

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const questDataManager = require('../../manager/questDataManager');
const { generateCompletedQuestsView } = require('../utils/paginationUtils');
const { handleInteractionError } = require('../../utils/interactionErrorLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('終了クエスト一覧')
    .setDescription('終了済みのクエストを一覧表示します。'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Check if there are any completed quests first to avoid unnecessary view generation
      const allQuests = await questDataManager.getAllQuests(interaction.guildId);
      const endedQuests = Object.values(allQuests).filter(q => q.isArchived);
      if (endedQuests.length === 0) {
        return interaction.editReply({ content: '終了済みのクエストはありません。' });
      }

      const view = await generateCompletedQuestsView(interaction, 1);

      await interaction.editReply(view);
    } catch (error) {
      await handleInteractionError({ interaction, error, context: '終了クエスト一覧表示' });
    }
  },
};