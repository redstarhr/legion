// e:/共有フォルダ/legion/quest_bot/interactions/buttons/questOpenDmModal.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { canEditQuest } = require('../../../manager/permissionManager');
const questDataManager = require('../../../manager/questDataManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
    customId: 'quest_open_dmModal_', // Prefix match
    async handle(interaction) {
        try {
            const questId = interaction.customId.replace('quest_open_dmModal_', '');
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!(await canEditQuest(interaction, quest))) {
                return interaction.reply({ content: '🚫 参加者への連絡は、クエストの発注者または管理者のみが行えます。', flags: MessageFlags.Ephemeral });
            }

            const modal = new ModalBuilder()
                .setCustomId(`quest_submit_dmModal_${questId}`)
                .setTitle('参加者への一斉連絡');

            const messageInput = new TextInputBuilder()
                .setCustomId('dm_message')
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