// quest_bot/interactions/buttons/questCancel.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');

module.exports = {
  customId: 'quest_open_cancelConfirm_', // Prefix match
  async handle (interaction) {
    try {
      const questId = interaction.customId.split('_')[2];
      const quest = await questDataManager.getQuest(interaction.guildId, questId);

      if (!quest) {
        return interaction.reply({ content: '対象のクエストが見つかりませんでした。', flags: [MessageFlags.Ephemeral] });
      }

      // ユーザーがこのクエストを受注しているか確認
      const userAcceptances = quest.accepted?.filter(a => a.userId === interaction.user.id);
      if (!userAcceptances || userAcceptances.length === 0) {
        return interaction.reply({ content: 'あなたはこのクエストを受注していません。', flags: [MessageFlags.Ephemeral] });
      }

      const totalAcceptedTeams = userAcceptances.reduce((sum, a) => sum + a.teams, 0);
      const totalAcceptedPeople = userAcceptances.reduce((sum, a) => sum + a.people, 0);

      const confirmationRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`quest_confirm_cancel_${questId}`)
            .setLabel('はい、取り消します')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`quest_cancel_cancel_${questId}`)
            .setLabel('いいえ')
            .setStyle(ButtonStyle.Secondary)
        );

      await interaction.reply({
        content: `本当にクエスト「${quest.title || '無題'}」の受注（合計 ${totalAcceptedTeams}組 / ${totalAcceptedPeople}人）を取り消しますか？`,
        components: [confirmationRow],
        flags: [MessageFlags.Ephemeral],
      });
    } catch (error) {
      console.error('受注取消UIの表示中にエラーが発生しました:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'エラーが発生したため、UIを表示できませんでした。', flags: [MessageFlags.Ephemeral] }).catch(console.error);
      }
    }
  },
};