// quest_bot/interactions/buttons/questCancelConfirm.js
const { EmbedBuilder } = require('discord.js');
const questDataManager = require('../../../manager/questDataManager');
const { updateQuestMessage } = require('../../utils/questMessageManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');
const { calculateRemainingSlots } = require('../../utils/questUtils');
const { sendCancellationNotification } = require('../../utils/notificationManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
  customId: 'quest_confirm_cancel_', // Prefix match
  async handle (interaction) {
    try {
      await interaction.deferUpdate();

      const questId = interaction.customId.split('_')[3];
      const guildId = interaction.guildId;
      const userId = interaction.user.id;

      const quest = await questDataManager.getQuest(guildId, questId);
      if (!quest) {
        return interaction.editReply({ content: '⚠️ 対象のクエストが見つかりませんでした。', components: [] });
      }

      // Check if the quest was full before cancellation
      const { currentAcceptedTeams, currentAcceptedPeople } = calculateRemainingSlots(quest);
      const wasFullAndClosed = quest.isClosed && (currentAcceptedTeams >= (quest.teams || 1) && currentAcceptedPeople >= (quest.people || quest.players || 1));

      // Filter out the user's acceptances
      const newAccepted = quest.accepted?.filter(a => a.userId !== userId) || [];

      const updates = {
        accepted: newAccepted,
        // If the quest was closed because it was full, reopen it.
        isClosed: wasFullAndClosed ? false : quest.isClosed,
      };

      // Update quest data
      const updatedQuest = await questDataManager.updateQuest(guildId, questId, updates, interaction.user);
      if (!updatedQuest) {
        return interaction.editReply({ content: '⚠️ クエストデータの更新に失敗しました。', components: [] });
      }

      // Update all messages
      await updateQuestMessage(interaction.client, updatedQuest);
      await updateDashboard(interaction.client, guildId);

      // Log action
      await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
        title: '↩️ 受注取消',
        color: '#e67e22', // orange
        details: {
          'クエストタイトル': updatedQuest.title || '無題', // Use updatedQuest for consistency
          'クエストID': questId,
        },
      });

      // Send notification
      await sendCancellationNotification({ interaction, quest: updatedQuest, wasFull: wasFullAndClosed });

      // Final reply to user
      let replyMessage = '✅ クエストの受注を取り消しました。';
      if (wasFullAndClosed) { replyMessage += '\nℹ️ 募集が再開されました。'; }
      await interaction.editReply({ content: replyMessage, components: [] });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: '受注取消確認' });
    }
  },
};