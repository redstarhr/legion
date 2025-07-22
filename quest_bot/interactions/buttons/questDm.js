// quest_bot/interactions/buttons/questDm.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');

module.exports = {
  customId: 'quest_dm',
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
      return interaction.reply({ content: '参加者への連絡は、発注者または管理者のみが行えます。', ephemeral: true });
    }

    // Double-check for participants, though the button should be disabled.
    if (!quest.accepted || quest.accepted.length === 0) {
        return interaction.reply({ content: 'このクエストにはまだ参加者がいません。', ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId(`quest_dm_submit_${questId}`)
      .setTitle('参加者への一斉連絡');

    const messageInput = new TextInputBuilder()
      .setCustomId('dm_message')
      .setLabel('参加者全員に送信するメッセージ')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('リマインダーや変更点などを入力してください。このメッセージはBotから各参加者にDMで送信されます。')
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(messageInput));

    await interaction.showModal(modal);
  },
};