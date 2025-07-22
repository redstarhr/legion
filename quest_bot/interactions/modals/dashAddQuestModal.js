// quest_bot/interactions/modals/dashAddQuestModal.js
const questDataManager = require('../../utils/questDataManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');

module.exports = {
    customId: 'dash_submit_addQuestModal_', // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const name = interaction.fields.getTextInputValue('quest_name');
            const playersStr = interaction.fields.getTextInputValue('quest_players');
            const teamsStr = interaction.fields.getTextInputValue('quest_teams');

            const players = parseInt(playersStr, 10);
            const teams = parseInt(teamsStr, 10);

            if (isNaN(players) || isNaN(teams) || players < 0 || teams < 0) {
                return interaction.followUp({ content: '⚠️ 人数と組数には0以上の半角数字を入力してください。' });
            }

            const questDetails = { name, players, teams };
            const newQuest = await questDataManager.createQuest(interaction.guildId, questDetails, interaction.user);

            await logAction(interaction, {
                title: '➕ クエスト追加',
                color: '#2ecc71',
                details: {
                    'クエスト名': newQuest.name,
                    '募集人数': `${newQuest.players}人`,
                    '募集組数': `${newQuest.teams}組`,
                    'クエストID': newQuest.id,
                },
            });

            // ダッシュボードを更新
            await updateDashboard(interaction.client, interaction.guildId);

            await interaction.followUp({ content: `✅ クエスト「${name}」を追加しました。` });

        } catch (error) {
            console.error('クエスト追加処理中にエラーが発生しました:', error);
            await interaction.followUp({ content: '❌ エラーが発生したため、クエストを追加できませんでした。' });
        }
    },
};