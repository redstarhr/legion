// quest_bot/interactions/buttons/questReopen.js
const questDataManager = require('../../utils/questDataManager');
const { updateAllQuestMessages } = require('../../utils/messageUpdater');
const { logAction } = require('../../utils/logger');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');

module.exports = {
  customId: 'quest_reopen',
  async handle(interaction) {
    await interaction.deferUpdate();

    const questId = interaction.customId.split('_')[2];
    const quest = await questDataManager.getQuest(interaction.guildId, questId);

    if (!quest) {
      return interaction.followUp({ content: '対象のクエストが見つかりませんでした。', ephemeral: true });
    }

    // Permission check: issuer or manager
    const isIssuer = quest.issuerId === interaction.user.id;
    const isManager = await hasQuestManagerPermission(interaction);

    if (!isIssuer && !isManager) {
      return interaction.followUp({ content: 'クエストの募集再開は、発注者または管理者のみが行えます。', ephemeral: true });
    }

    // 1. クエストデータを更新して募集を再開
    await questDataManager.updateQuest(interaction.guildId, questId, { isClosed: false }, interaction.user);

    // 2. 更新後のクエストを取得し、全てのメッセージを更新
    const updatedQuest = await questDataManager.getQuest(interaction.guildId, questId);
    await updateAllQuestMessages(interaction.client, updatedQuest, interaction.user.id);

    // 3. アクションをログに記録
    await logAction(interaction, {
      title: '🟢 募集再開',
      color: '#2ecc71', // green
      details: {
        'クエストタイトル': updatedQuest.title || '無題',
        'クエストID': questId,
      },
    });

    // 4. 実行者に完了を通知
    await interaction.followUp({ content: '✅ クエストの募集を再開しました。', ephemeral: true });
  },
};