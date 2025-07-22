// quest_bot/interactions/selectMenus/configUnlinkSelect.js
const questDataManager = require('../../utils/questDataManager');
const { logAction } = require('../../utils/logger');

module.exports = {
  customId: 'config_unlink_select_', // Prefix match
  async handle(interaction) {
    try {
      await interaction.deferUpdate();

      const [originalQuestId, linkedMessageId] = interaction.values[0].split('_');
      const guildId = interaction.guildId;

      const originalQuest = await questDataManager.getQuest(guildId, originalQuestId);

      if (!originalQuest) {
        return interaction.editReply({ content: '⚠️ 元のクエストが見つかりませんでした。データが不整合な状態かもしれません。', components: [] });
      }

      const linkedMessageInfo = originalQuest.linkedMessages.find(link => link.messageId === linkedMessageId);
      if (!linkedMessageInfo) {
          return interaction.editReply({ content: '⚠️ 連携情報が見つかりませんでした。既に解除されている可能性があります。', components: [] });
      }

      // 1. 連携リストから対象を削除
      const updatedLinks = originalQuest.linkedMessages.filter(
        link => link.messageId !== linkedMessageId
      );

      // 2. データベースを更新
      const updateSuccess = await questDataManager.updateQuest(guildId, originalQuest.messageId, {
        linkedMessages: updatedLinks,
      }, interaction.user);

      if (!updateSuccess) {
        return interaction.editReply({ content: '⚠️ データベースの更新に失敗しました。', components: [] });
      }

      // 3. アクションをログに記録
      await logAction(interaction, {
        title: '🗑️ クエスト連携 解除',
        color: '#e74c3c',
        details: {
          '元クエストID': originalQuest.messageId,
          '解除対象メッセージID': linkedMessageId,
          '解除対象チャンネル': `<#${linkedMessageInfo.channelId}>`,
        },
      });

      // 4. Discord上のメッセージを削除
      try {
        const channel = await interaction.client.channels.fetch(linkedMessageInfo.channelId);
        await channel.messages.delete(linkedMessageId);
      } catch (error) {
        console.error('連携解除メッセージの削除に失敗:', error);
        await interaction.followUp({ content: '⚠️ データベースからの連携解除には成功しましたが、Discord上のメッセージ削除に失敗しました。お手数ですが手動で削除してください。', ephemeral: true });
      }

      await interaction.editReply({ content: `✅ <#${linkedMessageInfo.channelId}> の掲示板の連携を解除しました。`, components: [] });
    } catch (error) {
      console.error('連携解除の処理中にエラーが発生しました:', error);
      await interaction.editReply({ content: 'エラーが発生したため、連携を解除できませんでした。', components: [] });
    }
  },
};