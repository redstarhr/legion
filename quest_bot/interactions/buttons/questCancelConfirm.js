// quest_bot/interactions/buttons/questCancelConfirm.js
const { EmbedBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { createQuestEmbed } = require('../../utils/embeds');
const { createQuestActionRows } = require('../../components/questActionButtons');
const { logAction } = require('../../utils/logger');

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
      const currentAcceptedTeams = quest.accepted?.reduce((sum, a) => sum + a.teams, 0) || 0;
      const currentAcceptedPeople = quest.accepted?.reduce((sum, a) => sum + a.people, 0) || 0;
      const wasFullAndClosed = quest.isClosed && (currentAcceptedTeams >= quest.teams && currentAcceptedPeople >= quest.people);

      // Filter out the user's acceptances
      const newAccepted = quest.accepted?.filter(a => a.userId !== userId) || [];

      const updates = {
        accepted: newAccepted,
        // If the quest was closed because it was full, reopen it.
        isClosed: wasFullAndClosed ? false : quest.isClosed,
      };

      // Update quest data
      const success = await questDataManager.updateQuest(guildId, questId, updates, interaction.user);
      if (!success) {
        return interaction.editReply({ content: '⚠️ クエストデータの更新に失敗しました。', components: [] });
      }

      // Update all messages
      const updatedQuest = await questDataManager.getQuest(guildId, questId);
      // 元のクエストメッセージのみ更新
      try {
        const questChannel = await interaction.client.channels.fetch(updatedQuest.channelId);
        const questMessage = await questChannel.messages.fetch(updatedQuest.messageId);
        const newEmbed = await createQuestEmbed(updatedQuest);
        const newButtons = await createQuestActionRows(updatedQuest);
        await questMessage.edit({ embeds: [newEmbed], components: newButtons });
      } catch (e) {
        console.error(`[MessageUpdate] Failed to update original quest message ${updatedQuest.messageId}:`, e);
        // ログには残すが、ユーザーへの通知は続行
      }

      // Log action
      await logAction(interaction, {
        title: '↩️ 受注取消',
        color: '#e67e22', // orange
        details: {
          'クエストタイトル': updatedQuest.title || '無題',
          'クエストID': updatedQuest.messageId,
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