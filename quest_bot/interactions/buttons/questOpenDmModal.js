// e:/共有フォルダ/legion/quest_bot/interactions/buttons/questOpenDmModal.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { canEditQuest } = require('../../../manager/permissionManager');
const questDataManager = require('../../../manager/questDataManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { QUEST_OPEN_DM_MODAL, QUEST_DM_MODAL, QUEST_DM_MESSAGE_INPUT } = require('../../utils/customIds');

module.exports = {
    customId: QUEST_OPEN_DM_MODAL,
    async handle(interaction) {
        try {
            const questId = interaction.customId.replace(QUEST_OPEN_DM_MODAL, '');
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!(await canEditQuest(interaction, quest))) {
                return interaction.reply({ content: '🚫 参加者への連絡は、クエストの発注者または管理者のみが行えます。', flags: MessageFlags.Ephemeral });
            }

            const modal = new ModalBuilder()
                .setCustomId(`${QUEST_DM_MODAL}${questId}`)
                .setTitle('参加者への一斉連絡');

            const messageInput = new TextInputBuilder()
                .setCustomId(QUEST_DM_MESSAGE_INPUT)
                .setLabel('送信するメッセージ')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('参加者全員に送信されるメッセージを入力してください。')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(messageInput));

            await interaction.showModal(modal);
        } catch (error) {
            await handleInteractionError({ interaction, error, context: '参加者DMモーダル表示' });
        }
    }
};