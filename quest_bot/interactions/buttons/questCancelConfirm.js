// quest_bot/interactions/buttons/questCancelConfirm.js
const { EmbedBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { updateQuestMessage } = require('../../utils/questMessageManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');
const { calculateRemainingSlots } = require('../../utils/questUtils');

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
      await logAction(interaction, {
        title: '↩️ 受注取消',
        color: '#e67e22', // orange
        details: {
          'クエストタイトル': updatedQuest.title || '無題', // Use updatedQuest for consistency
          'クエストID': questId,
        },
      });

      // Send notification
      const notificationChannelId = await questDataManager.getNotificationChannel(guildId);
      if (notificationChannelId) {
        try {
          const notificationChannel = await interaction.client.channels.fetch(notificationChannelId);
          if (notificationChannel?.isTextBased()) {
            const notificationEmbed = new EmbedBuilder().setColor(0xf4900c).setTitle('⚠️ 受注取消通知').setDescription(`クエスト「${updatedQuest.title || '無題のクエスト'}」の受注が取り消されました。`).addFields({ name: '取消者', value: interaction.user.tag, inline: true }).setTimestamp();
            if (wasFullAndClosed) { notificationEmbed.setFooter({ text: 'ℹ️ この取消により、募集が自動的に再開されました。' }); }
            await notificationChannel.send({ embeds: [notificationEmbed] });
          }
        } catch (error) { console.error(`[${guildId}] Notification failed for quest cancellation ${questId}:`, error); }
      }

      // Final reply to user
      let replyMessage = '✅ クエストの受注を取り消しました。';
      if (wasFullAndClosed) { replyMessage += '\nℹ️ 募集が再開されました。'; }
      await interaction.editReply({ content: replyMessage, components: [] });
    } catch (error) {
      console.error('受注取消の処理中にエラーが発生しました:', error);
      await interaction.editReply({ content: 'エラーが発生したため、受注を取り消せませんでした。', components: [] }).catch(console.error);
    }
  },
};