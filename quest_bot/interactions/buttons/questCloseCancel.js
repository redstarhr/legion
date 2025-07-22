// quest_bot/interactions/buttons/questCloseCancel.js

module.exports = {
  customId: 'quest_cancel_close_', // Prefix match
  async handle (interaction) {
    try {
      // 確認メッセージを更新して操作がキャンセルされたことを通知し、ボタンを削除する
      await interaction.update({
        content: '操作はキャンセルされました。',
        components: [],
      });
    } catch (error) {
      console.error('募集〆切キャンセルの処理中にエラーが発生しました:', error);
    }
  },
};