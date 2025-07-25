
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const questDataManager = require('../../../manager/questDataManager');
const { canEditQuest } = require('../../../manager/permissionManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

/**
 * Formats an ISO date string into 'YYYY-MM-DD HH:MM' format for display.
 * @param {string | null} isoString The ISO date string to format.
 * @returns {string} The formatted date string or an empty string.
 */
function formatISODateForInput(isoString) {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        const pad = (num) => num.toString().padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (e) {
        return ''; // Return empty if parsing fails
    }
}

module.exports = {
    customId: 'quest_edit_', // Prefix match
    async handle(interaction) {
        try {
            const questId = interaction.customId.replace('quest_edit_', '');
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!quest) {
                return interaction.reply({ content: '⚠️ 対象のクエストが見つかりませんでした。', flags: MessageFlags.Ephemeral });
            }

            if (!(await canEditQuest(interaction, quest))) {
                return interaction.reply({ content: '🚫 このクエストを編集する権限がありません。', flags: MessageFlags.Ephemeral });
            }

            if (quest.isArchived) {
                return interaction.reply({ content: '⚠️ 完了済みのクエストは編集できません。', flags: MessageFlags.Ephemeral });
            }

            const modal = new ModalBuilder()
                .setCustomId(`quest_edit_submit_${questId}`)
                .setTitle('クエストの編集');

            const titleInput = new TextInputBuilder()
                .setCustomId('quest_title')
                .setLabel('クエストタイトル')
                .setStyle(TextInputStyle.Short)
                .setValue(quest.title || quest.name || '')
                .setRequired(true)
                .setMaxLength(100);

            const descriptionInput = new TextInputBuilder()
                .setCustomId('quest_description')
                .setLabel('クエスト詳細')
                .setStyle(TextInputStyle.Paragraph)
                .setValue(quest.description || '')
                .setRequired(false)
                .setMaxLength(1000);

            const peopleInput = new TextInputBuilder()
                .setCustomId('quest_people')
                .setLabel('募集 人数（1組あたり）')
                .setStyle(TextInputStyle.Short)
                .setValue(String(quest.people || quest.players || '1'))
                .setRequired(true);

            const deadlineInput = new TextInputBuilder()
                .setCustomId('quest_deadline')
                .setLabel('募集期限（YYYY-MM-DD HH:MM形式）')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('例：2024-12-31 23:59 (未入力で無期限)')
                .setValue(formatISODateForInput(quest.deadline))
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(descriptionInput),
                new ActionRowBuilder().addComponents(peopleInput),
                new ActionRowBuilder().addComponents(deadlineInput)
            );

            await interaction.showModal(modal);

        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'クエスト編集モーダル表示' });
        }
    },