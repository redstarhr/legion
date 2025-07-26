// quest_bot/interactions/buttons/configDeleteDashboardConfirm.js
const { RESTJSONErrorCodes, MessageFlags } = require('discord.js');
const questDataManager = require('../../../manager/questDataManager');
const { logAction } = require('../../utils/logger');
const { createConfigPanel } = require('../../components/configPanel');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
  customId: 'config_confirm_deleteDashboard',
  async handle(interaction) {
    try {
      await interaction.deferUpdate();

      // 複数チャネル対応のため配列で取得
      const dashboards = await questDataManager.getDashboard(interaction.guildId);

      if (!dashboards || dashboards.length === 0) {
        const newView = await createConfigPanel(interaction);
        return interaction.editReply({
          content: '✅ ダッシュボードは既に削除されているか、見つかりませんでした。',
          ...newView,
        });
      }

      // 複数のダッシュボードメッセージを削除
      for (const dashboard of dashboards) {
        try {
          const channel = await interaction.client.channels.fetch(dashboard.channelId);
          await channel.messages.delete(dashboard.messageId);
        } catch (error) {
          // メッセージが既に削除されている場合は無視
          if (error.code !== RESTJSONErrorCodes.UnknownMessage) {
            throw error;
          }
          console.warn(`[DashboardDelete] ダッシュボードメッセージ (ID: ${dashboard.messageId}) は既に削除されていました。`);
        }
      }

      // ダッシュボード設定をクリア（全削除）
      await questDataManager.setDashboard(interaction.guildId, null);

      // ログ記録
      await logAction(
        { client: interaction.client, guildId: interaction.guildId, user: interaction.user },
        {
          title: '🗑️ ダッシュボード削除',
          color: '#e74c3c',
          description: 'クエストダッシュボードがすべて削除されました。',
        }
      );

      // 設定パネル更新
      const newView = await createConfigPanel(interaction);
      await interaction.editReply({
        content: '✅ すべてのクエストダッシュボードを削除しました。',
        ...newView,
      });

    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'ダッシュボード削除確認' });
    }
  },
};
