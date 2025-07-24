// quest_bot/interactions/selectMenus/unarchiveSelect.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');
const { updateQuestMessage } = require('../../utils/questMessageManager');
const { generateCompletedQuestsView } = require('../../utils/paginationUtils');
const { handleInteractionError } = require('../../../interactionErrorLogger');

module.exports = {
  customId: 'list_select_unarchive_', // Prefix match
  async handle(interaction) {
    try {
      const userId = interaction.customId.split('_')[3];
      if (interaction.user.id !== userId) {
        return interaction.reply({ content: 'あなたはこのメニューを操作できません。', flags: MessageFlags.Ephemeral });
      }

      await interaction.deferUpdate();

      const questIdToUnarchive = interaction.values[0];
      const guildId = interaction.guildId;

      // 1. Update quest status (unarchive, reopen for recruitment)
      const unarchivedQuest = await questDataManager.updateQuest(guildId, questIdToUnarchive, {
        isArchived: false,
        completedAt: null, // Clear the completion timestamp
      }, interaction.user);

      if (!unarchivedQuest) {
        return interaction.followUp({ content: '⚠️ クエストの状態を戻すのに失敗しました。', flags: MessageFlags.Ephemeral });
      }

      // 2. クエストメッセージとダッシュボードを更新
      await updateQuestMessage(interaction.client, unarchivedQuest);
      await updateDashboard(interaction.client, guildId);

      // 3. Log the action
      await logAction(interaction, {
        title: '↩️ クエスト完了状態の取消',
        color: '#3498db', // blue
        details: {
          'クエスト名': unarchivedQuest.name || '無題',
          'クエストID': questIdToUnarchive,
        },
      });

      // 4. Refresh the completed quests list view
      const footerText = interaction.message.embeds[0].footer.text;
      let currentPage = parseInt(footerText.match(/ページ (\d+) \/ \d+/)[1], 10);

      // The list has changed, so we need to generate the view again.
      // The page number might be out of bounds if it was the last item on the page,
      // but generateCompletedQuestsView handles this.
      const newView = await generateCompletedQuestsView(interaction, currentPage);

      await interaction.editReply({
        ...newView,
      });

      // 5. Notify the user of completion
      await interaction.followUp({
        content: `✅ クエスト「${unarchivedQuest.name || '無題'}」をアクティブな状態に戻しました。`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'クエスト完了状態取消' });
    }
  },
};