// quest_bot/interactions/buttons/questCloseConfirm.js
const questDataManager = require('../../utils/questDataManager');
const { MessageFlags } = require('discord.js');
const { createQuestEmbed } = require('../../utils/embeds');
const { createQuestActionRows } = require('../../components/questActionButtons');
const { logAction } = require('../../utils/logger');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');

module.exports = {
  customId: 'quest_confirm_close_', // Prefix match
  async handle (interaction) {
    try {
      // 確認メッセージを更新する準備
      await interaction.deferUpdate();

      const questId = interaction.customId.split('_')[3];
      const quest = await questDataManager.getQuest(interaction.guildId, questId);

      if (!quest) {
        return interaction.editReply({ content: '対象のクエストが見つかりませんでした。', components: [] });
      }

      // 念のため再度権限チェック
      const isIssuer = quest.issuerId === interaction.user.id;
      const isManager = await hasQuestManagerPermission(interaction);

      if (!isIssuer && !isManager) {
        return interaction.editReply({ content: 'クエストの〆切は、発注者または管理者のみが行えます。', components: [] });
      }

      // 1. クエストデータを更新
      await questDataManager.updateQuest(interaction.guildId, questId, { isClosed: true }, interaction.user);

      // 2. 更新後のクエストを取得し、全てのメッセージを更新
      const updatedQuest = await questDataManager.getQuest(interaction.guildId, questId);
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

      // 3. アクションをログに記録
      await logAction(interaction, {
        title: '🚫 募集〆切',
        color: '#e74c3c', // red
        details: {
          'クエストタイトル': updatedQuest.title || '無題',
          'クエストID': questId,
        },
      });

      // 4. 確認メッセージを更新して処理完了を通知
      await interaction.editReply({ content: '✅ クエストの募集を締め切りました。', components: [] });
    } catch (error) {
      console.error('募集〆切の確認処理中にエラーが発生しました:', error);
      await interaction.followUp({ content: 'エラーが発生したため、募集を締め切れませんでした。', flags: [MessageFlags.Ephemeral] }).catch(console.error);
    }
  },
};