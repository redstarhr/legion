// interactions/buttons/questArchiveButton.js

const questDataManager = require('../../utils/questDataManager');
const { updateAllQuestMessages } = require('../../utils/messageUpdater');
const { logAction } = require('../../utils/logger');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');

module.exports = {
  customId: 'quest_archive_button',

  async handle(interaction) {
    await interaction.deferUpdate();

    if (!(await hasQuestManagerPermission(interaction))) {
      return interaction.followUp({ content: '⚠️ あなたにはこのクエストを完了する権限がありません。', ephemeral: true });
    }

    const originalMessageId = interaction.message.id;
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    // 1. クエストをアーカイブ状態に更新
    const result = questDataManager.archiveQuest(guildId, originalMessageId);

    if (!result || !result.quest) {
      return interaction.followUp({ content: '⚠️ クエストの完了処理に失敗しました。', ephemeral: true });
    }

    const { quest } = result;

    // 2. 共通関数を使って全ての関連メッセージを更新
    await updateAllQuestMessages(interaction.client, quest, userId);

    await interaction.followUp({ content: '✅ クエストを完了状態にしました。', ephemeral: true });
    logAction(interaction, 'クエストを完了', `クエストID: ${originalMessageId}`);
  },
};