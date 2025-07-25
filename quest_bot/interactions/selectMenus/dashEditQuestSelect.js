// quest_bot/interactions/selectMenus/dashEditQuestSelect.js
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
    customId: 'dash_select_editQuest_', // Prefix match
    async handle(interaction) {
        try {
            const questId = interaction.values[0];
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!quest) {
                return interaction.update({ content: '⚠️ 選択されたクエストが見つかりませんでした。ダッシュボードが更新されるまでお待ちください。', components: [] });
            }

            if (!(await canEditQuest(interaction, quest))) {
                return interaction.update({ content: '🚫 このクエストを編集する権限がありません。', components: [] });
            }

            if (quest.isArchived) {
                return interaction.update({ content: '⚠️ 終了済みのクエストは編集できません。', components: [] });
            }

            // Build the same modal as the quest_edit button
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

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(descriptionInput),
                new ActionRowBuilder().addComponents(peopleInput)
            );

            await interaction.showModal(modal);

        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ダッシュボードからのクエスト編集モーダル表示' });
        }
    },
};