// e:/\u5171\u6709\u30d5\u30a9\u30eb\u30c0/legion/quest_bot/interactions/selectMenus/dashAddQuestKamaSelect.js

const questDataManager = require('../../utils/questDataManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');

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
        await logAction(interaction, {
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
    customId: 'dash_select_addQuest_kama_', // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferUpdate();

            const kamaCount = parseInt(interaction.values[0], 10);
            const praCount = parseInt(interaction.customId.split('_')[4], 10);

            const createdQuests = [];

            const newPraQuest = await createAndLogQuest(interaction, 'プラ', praCount);
            if (newPraQuest) createdQuests.push(newPraQuest);

            const newKamaQuest = await createAndLogQuest(interaction, 'カマ', kamaCount);
            if (newKamaQuest) createdQuests.push(newKamaQuest);

            if (createdQuests.length > 0) {
                // Update the dashboard to show the new quests
                await updateDashboard(interaction.client, interaction.guildId);

                const questNames = createdQuests.map(q => `「${q.name}」`).join('と');
                await interaction.editReply({
                    content: `✅ クエスト${questNames}を追加しました！`,
                    components: [], // Remove the select menu
                });
            } else {
                await interaction.editReply({
                    content: '人数が0人のため、クエストは追加されませんでした。',
                    components: [],
                });
            }

        } catch (error) {
            console.error('カマ人数選択・クエスト作成処理中にエラーが発生しました:', error);
            await interaction.editReply({ content: 'エラーが発生したため、クエストを追加できませんでした。', components: [] }).catch(console.error);
        }
    },
};