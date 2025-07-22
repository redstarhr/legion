// quest_bot/interactions/buttons/questCloseConfirm.js
const questDataManager = require('../../utils/questDataManager');
const { updateAllQuestMessages } = require('../../utils/messageUpdater');
const { logAction } = require('../../utils/logger');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');

module.exports = {
  customId: 'quest_close_confirm',
  async handle(interaction) {
    // 確認メッセージを更新する準備
    await interaction.deferUpdate();

    const questId = interaction.customId.split('_')[3];
    const quest = await questDataManager.getQuest(interaction.guildId, questId);

    if (!quest) {
      return interaction.editReply({ content: '対象のクエストが見つかりませんでした。', components: [] });
    }

    // 念のため再度権限チェック
    const isIssuer = quest.issuerId === interaction.user.id;
    const isManager = await hasQuestManagerPermission(interaction);

    if (!isIssuer && !isManager) {
      return interaction.editReply({ content: 'クエストの〆切は、発注者または管理者のみが行えます。', components: [] });
    }

    // 1. クエストデータを更新
    await questDataManager.updateQuest(interaction.guildId, questId, { isClosed: true }, interaction.user);

    // 2. 更新後のクエストを取得し、全てのメッセージを更新
    const updatedQuest = await questDataManager.getQuest(interaction.guildId, questId);
    await updateAllQuestMessages(interaction.client, updatedQuest, interaction.user.id);

    // 3. アクションをログに記録
    await logAction(interaction, {
      title: '🚫 募集〆切',
      color: '#e74c3c', // red
      details: {
        'クエストタイトル': updatedQuest.title || '無題',
        'クエストID': questId,
      },
    });

    // 4. 確認メッセージを更新して処理完了を通知
    await interaction.editReply({ content: '✅ クエストの募集を締め切りました。', components: [] });
  },
};