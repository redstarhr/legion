const { MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

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

            const praCountStr = interaction.fields.getTextInputValue('pra_count');
            const kamaCountStr = interaction.fields.getTextInputValue('kama_count');

            const praCount = parseInt(praCountStr, 10);
            const kamaCount = parseInt(kamaCountStr, 10);

            // Input validation
            if (isNaN(praCount) || isNaN(kamaCount) || praCount < 0 || kamaCount < 0 || praCount > 24 || kamaCount > 24) {
                return interaction.editReply({ content: '⚠️ 募集人数には0から24までの半角数字を入力してください。' });
            }

            const questsToCreate = [
                { name: 'プラ', count: praCount },
                { name: 'カマ', count: kamaCount }
            ];

            const creationPromises = questsToCreate
                .filter(q => q.count > 0) // Only create quests if count > 0
                .map(q => createAndLogQuest(interaction, q.name, q.count));

            // Run all creation tasks in parallel and filter out null results
            const createdQuests = (await Promise.all(creationPromises)).filter(Boolean);

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