// quest_bot/interactions/buttons/questArchiveConfirm.js
const questDataManager = require('../../utils/questDataManager');
const { updateAllQuestMessages } = require('../../utils/messageUpdater');
const { logAction } = require('../../utils/logger');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');

module.exports = {
  customId: 'quest_confirm_archive_', // Prefix match
  async handle (interaction) {
    await interaction.deferUpdate();

    const questId = interaction.customId.split('_')[3];
    const quest = await questDataManager.getQuest(interaction.guildId, questId);

    if (!quest) {
      return interaction.editReply({ content: '対象のクエストが見つかりませんでした。', components: [] });
    }

    // Final permission check
    const isIssuer = quest.issuerId === interaction.user.id;
    const isManager = await hasQuestManagerPermission(interaction);

    if (!isIssuer && !isManager) {
      return interaction.editReply({ content: 'クエストの完了は、発注者または管理者のみが行えます。', components: [] });
    }

    // 1. Update quest data to be archived
    // Also set isClosed to true for consistency and add a timestamp
    await questDataManager.updateQuest(interaction.guildId, questId, {
      isArchived: true,
      isClosed: true,
      timestamp: Date.now(), // Used for sorting in listCompletedQuests
    }, interaction.user);

    // 2. Fetch updated quest and update all messages
    const updatedQuest = await questDataManager.getQuest(interaction.guildId, questId);
    await updateAllQuestMessages(interaction.client, updatedQuest);

    // 3. Log the action
    await logAction(interaction, {
      title: '✅ クエスト完了',
      color: '#95a5a6', // grey
      details: {
        'クエストタイトル': updatedQuest.title || '無題',
        'クエストID': questId,
      },
    });

    // 4. Update the confirmation message
    await interaction.editReply({ content: '✅ クエストを完了状態にしました。', components: [] });
  },
};