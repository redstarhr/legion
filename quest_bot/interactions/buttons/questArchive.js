// quest_bot/interactions/buttons/questArchive.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');

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

      const confirmationRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`quest_confirm_archive_${questId}`)
            .setLabel('はい、完了します')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`quest_cancel_archive_${questId}`)
            .setLabel('いいえ')
            .setStyle(ButtonStyle.Secondary)
        );

      await interaction.reply({
        content: '本当にこのクエストを完了状態にしますか？\n完了したクエストは `/完了クエスト一覧` から確認・復元できます。',
        components: [confirmationRow],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error('クエスト完了UIの表示中にエラーが発生しました:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'エラーが発生したため、UIを表示できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
      }
    }
  },
};