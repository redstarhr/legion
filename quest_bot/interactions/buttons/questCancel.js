// quest_bot/interactions/buttons/questCancel.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../../manager/questDataManager');
const { replyWithConfirmation } = require('../../components/confirmationUI');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
  customId: 'quest_open_cancelConfirm_', // Prefix match
  async handle (interaction) {
    try {
      const questId = interaction.customId.split('_')[3];
      const quest = await questDataManager.getQuest(interaction.guildId, questId);

      if (!quest) {
        return interaction.reply({ content: '対象のクエストが見つかりませんでした。', flags: MessageFlags.Ephemeral });
      }

      // ユーザーがこのクエストを現在アクティブに受注しているか確認 (ステータスがないもの)
      const userAcceptances = quest.accepted?.filter(a => a.userId === interaction.user.id && !a.status);
      if (!userAcceptances || userAcceptances.length === 0) {
        return interaction.reply({ content: 'あなたはこのクエストを受注していません。', flags: MessageFlags.Ephemeral });
      }

      const totalAcceptedPeople = userAcceptances.reduce((sum, a) => sum + (a.people || 0), 0);

      await replyWithConfirmation(interaction, {
        content: `本当にクエスト「${quest.title || '無題'}」の受注（合計 ${totalAcceptedPeople}人）を取り消しますか？`,
        confirmCustomId: `quest_confirm_cancel_${questId}`,
        confirmLabel: 'はい、取り消します',
        cancelCustomId: `quest_cancel_cancel_${questId}`,
      });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: '受注取消UI表示' });
    }
  },
};