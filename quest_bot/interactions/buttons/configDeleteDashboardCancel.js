// quest_bot/interactions/buttons/configDeleteDashboardCancel.js

module.exports = {
  customId: 'config_cancel_deleteDashboard',
  async handle(interaction) {
    try {
      await interaction.update({
        content: '操作はキャンセルされました。',
        components: [],
      });
    } catch (error) {
      console.error('ダッシュボード削除キャンセルの処理中にエラーが発生しました:', error);
    }
  },
};