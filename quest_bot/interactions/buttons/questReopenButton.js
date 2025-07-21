// interactions/buttons/questReopenButton.js

const questDataManager = require('../../utils/questDataManager');
const { updateAllQuestMessages } = require('../../utils/messageUpdater');
const { logAction } = require('../../utils/logger');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');

module.exports = {
  customId: 'quest_reopen_button',

  async handle(interaction) {
    await interaction.deferUpdate();

    if (!(await hasQuestManagerPermission(interaction))) {
      return interaction.followUp({ content: '⚠️ あなたにはこのクエストを再開する権限がありません。', ephemeral: true });
    }

    const originalMessageId = interaction.message.id;
    const guildId = interaction.guildId;

    // 1. Update the quest to reopen recruitment.
    await questDataManager.updateQuest(guildId, originalMessageId, { isClosed: false });

    // 2. Get the updated quest data.
    const quest = await questDataManager.getQuest(guildId, originalMessageId);
    if (!quest) {
      return interaction.followUp({ content: '⚠️ クエストデータの特定に失敗しました。', ephemeral: true });
    }

    // 3. 共通関数を使って全ての関連メッセージを更新
    await updateAllQuestMessages(interaction.client, quest, interaction.user.id);

    await interaction.followUp({ content: '✅ クエストの募集を再開しました。', ephemeral: true });
    await logAction(interaction, 'クエストを再開', `クエストID: ${originalMessageId}`);
  },
};