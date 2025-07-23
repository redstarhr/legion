// quest_bot/interactions/buttons/questCancel.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { replyWithConfirmation } = require('../../components/confirmationUI');

module.exports = {
  customId: 'quest_open_cancelConfirm_', // Prefix match
  async handle (interaction) {
    try {
      const questId = interaction.customId.split('_')[3];
      const quest = await questDataManager.getQuest(interaction.guildId, questId);

      if (!quest) {
        return interaction.reply({ content: '対象のクエストが見つかりませんでした。', flags: MessageFlags.Ephemeral });
      }

      // ユーザーがこのクエストを受注しているか確認
      const userAcceptances = quest.accepted?.filter(a => a.userId === interaction.user.id);
      if (!userAcceptances || userAcceptances.length === 0) {
        return interaction.reply({ content: 'あなたはこのクエストを受注していません。', flags: MessageFlags.Ephemeral });
      }

      const totalAcceptedTeams = userAcceptances.reduce((sum, a) => sum + a.teams, 0);
      const totalAcceptedPeople = userAcceptances.reduce((sum, a) => sum + a.people, 0);

      await replyWithConfirmation(interaction, {
        content: `本当にクエスト「${quest.title || '無題'}」の受注（合計 ${totalAcceptedTeams}組 / ${totalAcceptedPeople}人）を取り消しますか？`,
        confirmCustomId: `quest_confirm_cancel_${questId}`,
        confirmLabel: 'はい、取り消します',
        cancelCustomId: `quest_cancel_cancel_${questId}`,
      });
    } catch (error) {
      console.error('受注取消UIの表示中にエラーが発生しました:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'エラーが発生したため、UIを表示できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
      }
    }
  },
};