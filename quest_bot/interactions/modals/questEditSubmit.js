// e:/共有フォルダ/legion/quest_bot/interactions/modals/questEditSubmit.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../../manager/questDataManager');
const { canEditQuest } = require('../../../manager/permissionManager');
const { updateQuestMessage } = require('../../utils/questMessageManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

/**
 * Parses a date string in 'YYYY-MM-DD HH:MM' format.
 * @param {string} dateString The date string to parse.
 * @returns {{isValid: boolean, error: string|null, date: Date|null}}
 */
function parseDate(dateString) {
    const regex = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;
    const match = dateString.match(regex);

    if (!match) {
        return { isValid: false, error: '`YYYY-MM-DD HH:MM` 形式で入力してください。', date: null };
    }

    const [, year, month, day, hour, minute] = match.map(Number);
    const date = new Date(year, month - 1, day, hour, minute);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return { isValid: false, error: '存在しない日付です（例: 2月30日）。', date: null };
    }
    if (date < new Date()) {
        return { isValid: false, error: '過去の日時は設定できません。', date: null };
    }
    return { isValid: true, error: null, date: date };
}

module.exports = {
    customId: 'quest_edit_submit_', // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const questId = interaction.customId.replace('quest_edit_submit_', '');
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!quest || !(await canEditQuest(interaction, quest))) {
                return interaction.editReply({ content: '🚫 このクエストを編集する権限がありません。' });
            }

            const title = interaction.fields.getTextInputValue('quest_title');
            const description = interaction.fields.getTextInputValue('quest_description');
            const peopleRaw = interaction.fields.getTextInputValue('quest_people');

            const people = parseInt(peopleRaw, 10);
            if (isNaN(people) || people < 1) {
                return interaction.editReply({ content: '⚠️ 「募集 人数」には1以上の整数を入力してください。' });
            }

            const updates = { name: title, title, description, people, players: people, deadline: null };
            const updatedQuest = await questDataManager.updateQuest(interaction.guildId, questId, updates, interaction.user);

            await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
                title: '📝 クエスト修正', color: '#f1c40f',
                details: { 'クエスト名': title, '修正者': interaction.user.tag, 'クエストID': questId },
            });

            await updateQuestMessage(interaction.client, updatedQuest);
            await updateDashboard(interaction.client, interaction.guildId);

            await interaction.editReply({ content: `✅ クエスト「${title}」を修正しました。` });
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'クエスト編集内容保存' });
        }
    }
};