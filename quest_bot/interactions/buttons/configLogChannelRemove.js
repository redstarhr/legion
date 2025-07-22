// quest_bot/interactions/buttons/configLogChannelRemove.js
const questDataManager = require('../../utils/questDataManager');
const { logAction } = require('../../utils/logger');

module.exports = {
  customId: 'config_log_channel_', // Prefix match
  async handle(interaction) {
    try {
      // このハンドラは解除ボタン専用
      if (!interaction.customId.endsWith('_remove')) return;

      await interaction.deferUpdate();

      // 1. データベースを更新 (channelIdをnullに設定)
      await questDataManager.setLogChannel(interaction.guildId, null);

      const replyMessage = '✅ ログ出力チャンネルの設定を解除しました。';

      // 2. アクションをログに記録
      await logAction(interaction, {
        title: '⚙️ ログチャンネル設定',
        description: replyMessage,
        color: '#95a5a6',
        details: {
          '設定チャンネル': '解除',
        },
      });

      // 3. 設定用メッセージを更新して完了を通知
      await interaction.editReply({
        content: replyMessage,
        components: [], // メニューとボタンを削除
      });
    } catch (error) {
      console.error('ログチャンネルの解除処理中にエラーが発生しました:', error);
      await interaction.editReply({ content: 'エラーが発生したため、チャンネル設定を解除できませんでした。', components: [] });
    }
  },
};