// e:/共有フォルダ/legion/quest_bot/interactions/buttons/questCreate.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { canManageQuests } = require('../../../manager/permissionManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { QUEST_CREATE_MODAL, QUEST_TITLE_INPUT, QUEST_DESC_INPUT, QUEST_PLAYERS_INPUT, QUEST_DEADLINE_INPUT } = require('../utils/customIds');

module.exports = {
  customId: 'quest_create',
  async handle(interaction) {
    try {
        if (!(await canManageQuests(interaction))) {
          return interaction.reply({ content: '❌ クエストを作成する権限がありません。', ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId(QUEST_CREATE_MODAL)
            .setTitle('新しいクエストの作成');

        const titleInput = new TextInputBuilder().setCustomId(QUEST_TITLE_INPUT).setLabel('クエスト名').setStyle(TextInputStyle.Short).setRequired(true);
        const descInput = new TextInputBuilder().setCustomId(QUEST_DESC_INPUT).setLabel('内容').setStyle(TextInputStyle.Paragraph).setRequired(true);
        const playersInput = new TextInputBuilder().setCustomId(QUEST_PLAYERS_INPUT).setLabel('募集人数').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('例: 4');
        const deadlineInput = new TextInputBuilder().setCustomId(QUEST_DEADLINE_INPUT).setLabel('募集期限 (任意)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('例: 2024-12-31 23:59');

        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descInput),
            new ActionRowBuilder().addComponents(playersInput),
            new ActionRowBuilder().addComponents(deadlineInput)
        );

        await interaction.showModal(modal);
    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'クエスト作成ボタン処理' });
    }
  },
};