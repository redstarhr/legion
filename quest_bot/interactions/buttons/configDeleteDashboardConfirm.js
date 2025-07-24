// quest_bot/interactions/buttons/configDeleteDashboardConfirm.js
const { RESTJSONErrorCodes, MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { logAction } = require('../../utils/logger');
const { createConfigPanel } = require('../../components/configPanel');

const { handleInteractionError } = require('../../../interactionErrorLogger');
module.exports = {
  customId: 'config_confirm_deleteDashboard',
  async handle(interaction) {
    try {
      await interaction.deferUpdate();

      const dashboard = await questDataManager.getDashboard(interaction.guildId);

      if (!dashboard) {
        const newView = await createConfigPanel(interaction);
        return interaction.editReply({
          content: '✅ ダッシュボードは既に削除されているか、見つかりませんでした。',
          ...newView,
        });
      }

      // 1. Discord上のメッセージを削除
      try {
        const channel = await interaction.client.channels.fetch(dashboard.channelId);
        await channel.messages.delete(dashboard.messageId);
      } catch (error) {
        // メッセージが既に削除されている場合はエラーを無視して続行
        if (error.code !== RESTJSONErrorCodes.UnknownMessage) {
          throw error; // その他のエラーは上位のcatchに投げる
        }
        console.warn(`[DashboardDelete] ダッシュボードメッセージ (ID: ${dashboard.messageId}) は既に削除されていました。`);
      }

      // 2. データベースからダッシュボード設定を削除
      await questDataManager.setDashboard(interaction.guildId, null, null);

      // 3. アクションをログに記録
      await logAction(interaction, {
        title: '🗑️ ダッシュボード削除',
        color: '#e74c3c',
        description: 'クエストダッシュボードが削除されました。',
      });

      // 4. 設定パネルを更新して完了を通知
      const newView = await createConfigPanel(interaction);
      await interaction.editReply({
        content: '✅ クエストダッシュボードを削除しました。',
        ...newView,
      });

    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'ダッシュボード削除確認' });
    }
  },
};