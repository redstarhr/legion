// quest_bot/interactions/buttons/questCloseCancel.js

module.exports = {
  customId: 'quest_close_cancel',
  async handle(interaction) {
    // 確認メッセージを更新して操作がキャンセルされたことを通知し、ボタンを削除する
    await interaction.update({
      content: '操作はキャンセルされました。',
      components: [],
    });
  },
};