// interactions/buttons/paginationHandler.js

const { generateCompletedQuestsView } = require('../../utils/paginationUtils');

module.exports = {
  customId: 'pagination_list-completed_', // 完了クエスト一覧のページネーションを処理

  async handle(interaction) {
    const [ , , action, userId] = interaction.customId.split('_');

    // コマンドを実行した本人以外は操作できないようにする
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: 'あなたはこのボタンを操作できません。', ephemeral: true });
    }

    await interaction.deferUpdate();

    // 現在のページ番号をフッターから取得
    const footerText = interaction.message.embeds[0].footer.text;
    let currentPage = parseInt(footerText.match(/ページ (\d+) \/ \d+/)[1], 10);

    // ページ番号を更新
    if (action === 'next') currentPage++;
    if (action === 'prev') currentPage--;

    const newView = await generateCompletedQuestsView(interaction, currentPage);

    await interaction.editReply({
      ...newView,
    });
  },
};