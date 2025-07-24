// quest_bot/interactions/buttons/questClose.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { isQuestAdmin } = require('../../../utils/permissionManager');
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

      // Permission check: issuer or manager
      const isIssuer = quest.issuerId === interaction.user.id;
      const isManager = await isQuestAdmin(interaction);

      if (!isIssuer && !isManager) {
        return interaction.reply({ content: 'クエストの〆切は、発注者または管理者のみが行えます。', flags: MessageFlags.Ephemeral });
      }

      await replyWithConfirmation(interaction, {
        content: '本当にこのクエストの募集を締め切りますか？\nこの操作は「募集再開」ボタンで元に戻せます。',
        confirmCustomId: `quest_confirm_close_${questId}`,
        confirmLabel: 'はい、締め切ります',
        cancelCustomId: `quest_cancel_close_${questId}`,
      });
    } catch (error) {
      console.error('募集〆切UIの表示中にエラーが発生しました:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'エラーが発生したため、UIを表示できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
      }
    }
  },
};