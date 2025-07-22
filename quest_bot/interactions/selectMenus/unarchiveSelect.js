// quest_bot/interactions/selectMenus/unarchiveSelect.js
const questDataManager = require('../../utils/questDataManager');
const { updateAllQuestMessages } = require('../../utils/messageUpdater');
const { logAction } = require('../../utils/logger');
const { generateCompletedQuestsView } = require('../../utils/paginationUtils');

module.exports = {
  customId: 'unarchive_select',
  async handle(interaction) {
    const userId = interaction.customId.split('_')[2];
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: 'あなたはこのメニューを操作できません。', ephemeral: true });
    }

    await interaction.deferUpdate();

    const questIdToUnarchive = interaction.values[0];
    const guildId = interaction.guildId;

    // 1. Update quest status (unarchive, reopen for recruitment)
    const success = await questDataManager.updateQuest(guildId, questIdToUnarchive, {
      isArchived: false,
      isClosed: false, // Reopen recruitment
      timestamp: null, // Clear the completion timestamp
    }, interaction.user);

    if (!success) {
      return interaction.followUp({ content: '⚠️ クエストの状態を戻すのに失敗しました。', ephemeral: true });
    }

    // 2. Update all quest board messages
    const updatedQuest = await questDataManager.getQuest(guildId, questIdToUnarchive);
    await updateAllQuestMessages(interaction.client, updatedQuest);

    // 3. Log the action
    await logAction(interaction, {
      title: '↩️ クエスト完了状態の取消',
      color: '#3498db', // blue
      details: {
        'クエストタイトル': updatedQuest.title || '無題',
        'クエストID': questIdToUnarchive,
      },
    });

    // 4. Refresh the completed quests list view
    const footerText = interaction.message.embeds[0].footer.text;
    let currentPage = parseInt(footerText.match(/ページ (\d+) \/ \d+/)[1], 10);

    // The list has changed, so we need to generate the view again.
    // The page number might be out of bounds if it was the last item on the page,
    // but generateCompletedQuestsView handles this.
    const newView = await generateCompletedQuestsView(interaction, currentPage);

    await interaction.editReply({
      ...newView,
    });

    // 5. Notify the user of completion
    await interaction.followUp({
      content: `✅ クエスト「${updatedQuest.title || '無題'}」を募集中に戻しました。`,
      ephemeral: true,
    });
  },
};