// quest_bot/interactions/buttons/questClose.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');

module.exports = {
  customId: 'quest_close',
  async handle(interaction) {
    const questId = interaction.customId.split('_')[2];
    const quest = await questDataManager.getQuest(interaction.guildId, questId);

    if (!quest) {
      return interaction.reply({ content: '対象のクエストが見つかりませんでした。', ephemeral: true });
    }

    // Permission check: issuer or manager
    const isIssuer = quest.issuerId === interaction.user.id;
    const isManager = await hasQuestManagerPermission(interaction);

    if (!isIssuer && !isManager) {
      return interaction.reply({ content: 'クエストの〆切は、発注者または管理者のみが行えます。', ephemeral: true });
    }

    const confirmationRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`quest_close_confirm_${questId}`)
          .setLabel('はい、締め切ります')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`quest_close_cancel_${questId}`)
          .setLabel('いいえ')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.reply({
      content: '本当にこのクエストの募集を締め切りますか？\nこの操作は「募集再開」ボタンで元に戻せます。',
      components: [confirmationRow],
      ephemeral: true,
    });
  },
};