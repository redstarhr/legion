// quest_bot/interactions/buttons/questClose.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { canEditQuest } = require('../../../permissionManager');
const { replyWithConfirmation } = require('../../components/confirmationUI');

module.exports = {
  customId: 'quest_open_closeConfirm_', // Prefix match
  async handle (interaction) {
    try {
      const questId = interaction.customId.split('_')[3];
      const quest = await questDataManager.getQuest(interaction.guildId, questId);

      if (!quest) {
        return interaction.reply({ content: '対象のクエストが見つかりませんでした。', flags: MessageFlags.Ephemeral });
      }

      if (quest.isClosed) {
        return interaction.reply({ content: '⚠️ このクエストは既に締め切られています。', flags: MessageFlags.Ephemeral });
      }

      // Permission check: issuer or quest manager/creator
      if (!(await canEditQuest(interaction, quest))) {
        return interaction.reply({ content: 'クエストの〆切は、発注者または管理者のみが行えます。', flags: MessageFlags.Ephemeral });
      }

      await replyWithConfirmation(interaction, {
        content: '本当にこのクエストの募集を締め切りますか？\nこの操作は「募集再開」ボタンで元に戻せます。',
        confirmCustomId: `quest_confirm_close_${questId}`,
        confirmLabel: 'はい、締め切ります',
        cancelCustomId: `quest_cancel_close_${questId}`,
      });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: '募集〆切UI表示' });
    }
  },
};