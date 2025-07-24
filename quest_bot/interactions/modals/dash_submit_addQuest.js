const { MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');
const { handleInteractionError } = require('../../../interactionErrorLogger');

/**
 * Helper function to create a quest and log the action.
 * @param {import('discord.js').Interaction} interaction
 * @param {string} name - The name of the quest (e.g., 'プラ', 'カマ').
 * @param {number} count - The number of players for the quest.
 * @returns {Promise<object|null>} The created quest object or null if creation failed.
 */
async function createAndLogQuest(interaction, name, count) {
    if (count <= 0) return null;

    const questDetails = { name, players: count, teams: 1 };
    const newQuest = await questDataManager.createQuest(interaction.guildId, questDetails, interaction.user);

    if (newQuest) {
        await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
            title: '➕ クエスト追加',
            color: '#2ecc71',
            details: {
                'クエスト名': newQuest.name,
                '募集人数': `${newQuest.players}人`,
                'クエストID': newQuest.id,
            },
        });
    }
    return newQuest;
}

module.exports = {
    customId: 'dash_submit_addQuest_', // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const praCount = parseInt(interaction.fields.getTextInputValue('pra_count'), 10) || 0;
            const kamaCount = parseInt(interaction.fields.getTextInputValue('kama_count'), 10) || 0;

            const createdQuests = [];

            const newPraQuest = await createAndLogQuest(interaction, 'プラ', praCount);
            if (newPraQuest) createdQuests.push(newPraQuest);

            const newKamaQuest = await createAndLogQuest(interaction, 'カマ', kamaCount);
            if (newKamaQuest) createdQuests.push(newKamaQuest);

            if (createdQuests.length > 0) {
                await updateDashboard(interaction.client, interaction.guildId);
                const questNames = createdQuests.map(q => `「${q.name}」`).join('と');
                await interaction.editReply({ content: `✅ クエスト${questNames}を追加しました！` });
            } else {
                await interaction.editReply({ content: '人数が0人のため、クエストは追加されませんでした。' });
            }
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'クエスト一括追加処理' });
        }
    },
};