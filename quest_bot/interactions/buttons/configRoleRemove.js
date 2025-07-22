// quest_bot/interactions/buttons/configRoleRemove.js
const questDataManager = require('../../utils/questDataManager');
const { logAction } = require('../../utils/logger');

module.exports = {
  customId: 'config_action_removeRole_', // Prefix match
  async handle(interaction) {
    try {
      // このハンドラは解除ボタン専用
      if (!interaction.customId.endsWith('_remove')) return;

      await interaction.deferUpdate();

      // 1. データベースを更新 (roleIdをnullに設定)
      await questDataManager.setQuestManagerRole(interaction.guildId, null);

      const replyMessage = '✅ クエスト管理者ロールの設定を解除しました。';

      // 2. アクションをログに記録
      await logAction(interaction, {
        title: '⚙️ 管理者ロール設定',
        description: replyMessage,
        color: '#95a5a6',
        details: {
          '設定ロール': '解除',
        },
      });

      // 3. 設定用メッセージを更新して完了を通知
      await interaction.editReply({
        content: replyMessage,
        components: [], // メニューとボタンを削除
      });
    } catch (error) {
      console.error('管理者ロールの解除処理中にエラーが発生しました:', error);
      await interaction.editReply({ content: 'エラーが発生したため、ロール設定を解除できませんでした。', components: [] });
    }
  },
};