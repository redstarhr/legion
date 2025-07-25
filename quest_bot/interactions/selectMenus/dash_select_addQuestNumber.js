// e:/共有フォルダ/legion/quest_bot/interactions/selectMenus/dash_select_addQuestNumber.js
const questDataManager = require('../../../manager/questDataManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { hasQuestManagerPermission } = require('../../../utils/permissionUtils');

/**
 * Creates a quest, logs the action, and returns the new quest object.
 * @param {import('discord.js').Interaction} interaction
 * @param {string} name - The name of the quest.
 * @param {number} playerCount - The number of players for the quest.
 * @returns {Promise<object|null>} The created quest object or null if creation failed.
 */
async function createAndLogQuest(interaction, name, playerCount) {
    const questDetails = {
        name: name,
        players: playerCount,
        teams: 1, // 組は1で固定
        people: playerCount, // 互換性のため
    };
    const newQuest = await questDataManager.createQuest(interaction.guildId, questDetails, interaction.user);

    if (newQuest) {
        await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
            title: '➕ クエスト追加', color: '#2ecc71',
            details: { 'クエスト名': newQuest.name, '募集人数': `${newQuest.players}人`, 'クエストID': newQuest.id },
        });
    }
    return newQuest;
}

module.exports = {
    customId: 'dash_select_addQuestNumber_', // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferUpdate();

            // 権限を再チェック
            if (!(await hasQuestManagerPermission(interaction))) {
                return interaction.editReply({
                    content: 'クエストを追加する権限がありません。',
                    components: [],
                });
            }

            const questType = interaction.customId.replace('dash_select_addQuestNumber_', '');
            const playerCount = parseInt(interaction.values[0], 10);

            const newQuest = await createAndLogQuest(interaction, questType, playerCount);

            if (newQuest) {
                await updateDashboard(interaction.client, interaction.guildId);
                await interaction.editReply({ content: `✅ クエスト「${newQuest.name}」(${newQuest.players}人) を追加しました！`, components: [] });
            } else {
                await interaction.editReply({ content: '⚠️ クエストの追加に失敗しました。', components: [] });
            }
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'クエスト追加処理' });
        }
    },
};