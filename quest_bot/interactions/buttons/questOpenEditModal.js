
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const questDataManager = require('../../../manager/questDataManager');
const { canEditQuest } = require('../../../manager/permissionManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { QUEST_OPEN_EDIT_MODAL, QUEST_EDIT_MODAL, QUEST_EDIT_TITLE_INPUT, QUEST_EDIT_DESC_INPUT, QUEST_EDIT_PLAYERS_INPUT } = require('../../utils/customIds');

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
    customId: QUEST_OPEN_EDIT_MODAL,
    async handle(interaction) {
        try {
            const questId = interaction.customId.replace(QUEST_OPEN_EDIT_MODAL, '');
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!quest) {
                return interaction.reply({ content: '⚠️ 対象のクエストが見つかりませんでした。', flags: MessageFlags.Ephemeral });
            }

            if (!(await canEditQuest(interaction, quest))) {
                return interaction.reply({ content: '🚫 このクエストを編集する権限がありません。', flags: MessageFlags.Ephemeral });
            }

            if (quest.isArchived) {
                return interaction.reply({ content: '⚠️ 終了済みのクエストは編集できません。', flags: MessageFlags.Ephemeral });
            }

            const modal = new ModalBuilder()
                .setCustomId(`${QUEST_EDIT_MODAL}${questId}`)
                .setTitle('クエストの編集');

            const titleInput = new TextInputBuilder()
                .setCustomId(QUEST_EDIT_TITLE_INPUT)
                .setLabel('クエストタイトル')
                .setStyle(TextInputStyle.Short)
                .setValue(quest.title || quest.name || '')
                .setRequired(true)
                .setMaxLength(100);

            const descriptionInput = new TextInputBuilder()
                .setCustomId(QUEST_EDIT_DESC_INPUT)
                .setLabel('クエスト詳細')
                .setStyle(TextInputStyle.Paragraph)
                .setValue(quest.description || '')
                .setRequired(false)
                .setMaxLength(1000);

            const peopleInput = new TextInputBuilder()
                .setCustomId(QUEST_EDIT_PLAYERS_INPUT)
                .setLabel('募集人数')
                .setStyle(TextInputStyle.Short)
                .setValue(String(quest.people || quest.players || '1'))
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(descriptionInput),
                new ActionRowBuilder().addComponents(peopleInput)
            );

            await interaction.showModal(modal);

        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'クエスト編集モーダル表示' });
        }
    },