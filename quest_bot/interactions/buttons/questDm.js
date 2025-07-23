// quest_bot/interactions/buttons/questDm.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');

module.exports = {
  customId: 'quest_open_dmModal_', // Prefix match
  async handle (interaction) {
    try {
      const questId = interaction.customId.split('_')[3];
      const quest = await questDataManager.getQuest(interaction.guildId, questId);

      if (!quest) {
        return interaction.reply({ content: '対象のクエストが見つかりませんでした。', flags: MessageFlags.Ephemeral });
      }

      // Permission check: issuer or manager
      const isIssuer = quest.issuerId === interaction.user.id;
      const isManager = await hasQuestManagerPermission(interaction);

      if (!isIssuer && !isManager) {
        return interaction.reply({ content: '参加者への連絡は、発注者または管理者のみが行えます。', flags: MessageFlags.Ephemeral });
      }

      // Double-check for participants, though the button should be disabled.
      if (!quest.accepted || quest.accepted.length === 0) {
          return interaction.reply({ content: 'このクエストにはまだ参加者がいません。', flags: MessageFlags.Ephemeral });
      }

      const modal = new ModalBuilder()
        .setCustomId(`quest_submit_dmModal_${questId}`)
        .setTitle('参加者への一斉連絡');

      const messageInput = new TextInputBuilder()
        .setCustomId('dm_message')
        .setLabel('参加者全員に送信するメッセージ')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('リマインダーや変更点などを入力してください。このメッセージはBotから各参加者にDMで送信されます。')
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(messageInput));

      await interaction.showModal(modal);
    } catch (error) {
      console.error('参加者連絡モーダルの表示中にエラーが発生しました:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'エラーが発生したため、連絡を開始できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
      }
    }
  },
};