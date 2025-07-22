// quest_bot/interactions/buttons/questClose.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');

module.exports = {
  customId: 'quest_open_closeConfirm_', // Prefix match
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
        return interaction.reply({ content: 'クエストの〆切は、発注者または管理者のみが行えます。', flags: MessageFlags.Ephemeral });
      }

      const confirmationRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`quest_confirm_close_${questId}`)
            .setLabel('はい、締め切ります')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`quest_cancel_close_${questId}`)
            .setLabel('いいえ')
            .setStyle(ButtonStyle.Secondary)
        );

      await interaction.reply({
        content: '本当にこのクエストの募集を締め切りますか？\nこの操作は「募集再開」ボタンで元に戻せます。',
        components: [confirmationRow],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error('募集〆切UIの表示中にエラーが発生しました:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'エラーが発生したため、UIを表示できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
      }
    }
  },
};