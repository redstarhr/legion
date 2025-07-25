// quest_bot/interactions/buttons/questArchive.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../../manager/questDataManager');
const { canEditQuest } = require('../../../manager/permissionManager');
const { replyWithConfirmation } = require('../../components/confirmationUI');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { QUEST_OPEN_ARCHIVE_CONFIRM, QUEST_CONFIRM_ARCHIVE, QUEST_CANCEL_ARCHIVE } = require('../../utils/customIds');

module.exports = {
  customId: QUEST_OPEN_ARCHIVE_CONFIRM,
  async handle (interaction) {
    try {
      const questId = interaction.customId.replace(QUEST_OPEN_ARCHIVE_CONFIRM, '');
      const quest = await questDataManager.getQuest(interaction.guildId, questId);

      if (!quest) {
        return interaction.reply({ content: '対象のクエストが見つかりませんでした。', flags: MessageFlags.Ephemeral });
      }

      if (quest.isArchived) {
        return interaction.reply({ content: '⚠️ このクエストは既に完了（アーカイブ）済みです。', flags: MessageFlags.Ephemeral });
      }

      // Permission check: issuer or quest manager/creator
      if (!(await canEditQuest(interaction, quest))) {
        return interaction.reply({ content: 'クエストの完了は、発注者または管理者のみが行えます。', flags: MessageFlags.Ephemeral });
      }

      await replyWithConfirmation(interaction, {
        content: '本当にこのクエストを完了状態にしますか？\n完了したクエストは `/完了クエスト一覧` から確認・復元できます。',
        confirmCustomId: `${QUEST_CONFIRM_ARCHIVE}${questId}`,
        confirmLabel: 'はい、完了します',
        cancelCustomId: `${QUEST_CANCEL_ARCHIVE}${questId}`,
      });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'クエスト完了UI表示' });
    }
  },
};