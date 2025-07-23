// quest_bot/interactions/buttons/questArchive.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');
const { replyWithConfirmation } = require('../../components/confirmationUI');

module.exports = {
  customId: 'quest_open_archiveConfirm_', // Prefix match
  async handle (interaction) {
    try {
      const questId = interaction.customId.split('_')[2];
      const quest = await questDataManager.getQuest(interaction.guildId, questId);

      if (!quest) {
        return interaction.reply({ content: '対象のクエストが見つかりませんでした。', flags: MessageFlags.Ephemeral });
      }

      // Permission check: issuer or manager
      const isIssuer = quest.issuerId === interaction.user.id;
      const isManager = await hasQuestManagerPermission(interaction);

      if (!isIssuer && !isManager) {
        return interaction.reply({ content: 'クエストの完了は、発注者または管理者のみが行えます。', flags: MessageFlags.Ephemeral });
      }

      await replyWithConfirmation(interaction, {
        content: '本当にこのクエストを完了状態にしますか？\n完了したクエストは `/完了クエスト一覧` から確認・復元できます。',
        confirmCustomId: `quest_confirm_archive_${questId}`,
        confirmLabel: 'はい、完了します',
        cancelCustomId: `quest_cancel_archive_${questId}`,
      });
    } catch (error) {
      console.error('クエスト完了UIの表示中にエラーが発生しました:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'エラーが発生したため、UIを表示できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
      }
    }
  },
};