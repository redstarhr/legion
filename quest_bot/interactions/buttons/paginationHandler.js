// interactions/buttons/paginationHandler.js

const questDataManager = require('../../utils/questDataManager');
const { generateCompletedQuestsEmbed, generatePaginationButtons, QUESTS_PER_PAGE } = require('../../utils/paginationUtils');

module.exports = {
  customId: 'pagination_list-completed_', // 完了クエスト一覧のページネーションを処理

  async handle(interaction) {
    const [ , , action, userId] = interaction.customId.split('_');

    // コマンドを実行した本人以外は操作できないようにする
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: 'あなたはこのボタンを操作できません。', ephemeral: true });
    }

    await interaction.deferUpdate();

    // データを再取得
    const allQuests = await questDataManager.getAllQuests(interaction.guildId);
    const completedQuests = Object.values(allQuests)
      .filter(q => q.isArchived)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const guildId = interaction.guildId;
    const totalPages = Math.ceil(completedQuests.length / QUESTS_PER_PAGE);

    // 現在のページ番号をフッターから取得
    const footerText = interaction.message.embeds[0].footer.text;
    let currentPage = parseInt(footerText.match(/ページ (\d+) \/ \d+/)[1], 10);

    // ページ番号を更新
    if (action === 'next') currentPage++;
    if (action === 'prev') currentPage--;

    const start = (currentPage - 1) * QUESTS_PER_PAGE;
    const end = start + QUESTS_PER_PAGE;
    const questsOnPage = completedQuests.slice(start, end);

    const newEmbed = generateCompletedQuestsEmbed(currentPage, totalPages, questsOnPage, guildId);
    const newButtons = generatePaginationButtons(currentPage, totalPages, userId);

    await interaction.editReply({
      embeds: [newEmbed],
      components: [newButtons],
    });
  },
};