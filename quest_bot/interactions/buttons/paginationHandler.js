// interactions/buttons/paginationHandler.js

const { MessageFlags } = require('discord.js');
const { generateCompletedQuestsView } = require('../../utils/paginationUtils');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
  customId: 'list_completed_', // 完了クエスト一覧のページネーションを処理

  async handle(interaction) {
    try {
      // list_completed_prevPage_userId or list_completed_nextPage_userId
      const [ , , actionWithTarget, userId] = interaction.customId.split('_');
      const action = actionWithTarget.replace('Page', ''); // prevPage -> prev, nextPage -> next

      // コマンドを実行した本人以外は操作できないようにする
      if (interaction.user.id !== userId) {
        return interaction.reply({ content: 'あなたはこのボタンを操作できません。', flags: MessageFlags.Ephemeral });
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
    } catch (error) {
      await handleInteractionError({ interaction, error, context: '完了クエスト一覧ページネーション' });
    }
  },
};