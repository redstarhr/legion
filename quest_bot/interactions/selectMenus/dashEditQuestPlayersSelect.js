// quest_bot/interactions/selectMenus/dashEditQuestPlayersSelect.js
const questDataManager = require('../../utils/questDataManager');
const { updateQuestMessage } = require('../../utils/questMessageManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');

module.exports = {
    customId: 'dash_select_editPlayers_', // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferUpdate();

            const questId = interaction.customId.split('_')[3];
            const newPlayerCount = parseInt(interaction.values[0], 10);

            const quest = await questDataManager.getQuest(interaction.guildId, questId);
            if (!quest) {
                return interaction.editReply({ content: '⚠️ 対象のクエストが見つかりませんでした。', components: [] });
            }

            const updates = {
                players: newPlayerCount,
                people: newPlayerCount, // 互換性のために追加
            };
            await questDataManager.updateQuest(interaction.guildId, questId, updates, interaction.user);

            await logAction(interaction, {
                title: '📝 クエスト修正',
                color: '#f1c40f',
                details: {
                    'クエスト名': quest.name,
                    '新しい募集人数': `${newPlayerCount}人`,
                    'クエストID': questId,
                },
            });

            // クエストメッセージとダッシュボードを更新
            const updatedQuest = await questDataManager.getQuest(interaction.guildId, questId);
            await updateQuestMessage(interaction.client, updatedQuest);
            await updateDashboard(interaction.client, interaction.guildId);

            await interaction.editReply({ content: `✅ クエスト「${quest.name}」の募集人数を ${newPlayerCount}人 に修正しました。`, components: [] });

        } catch (error) {
            console.error('クエスト人数修正処理中にエラーが発生しました:', error);
            await interaction.editReply({ content: '❌ エラーが発生したため、クエストを修正できませんでした。', components: [] }).catch(console.error);
        }
    },
};