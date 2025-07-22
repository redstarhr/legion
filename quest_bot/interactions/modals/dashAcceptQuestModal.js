// quest_bot/interactions/modals/dashAcceptQuestModal.js
const questDataManager = require('../../utils/questDataManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');

module.exports = {
    customId: 'accept_quest_modal_', // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const [,,, questId] = interaction.customId.split('_');

            const teamsStr = interaction.fields.getTextInputValue('accept_teams');
            const playersStr = interaction.fields.getTextInputValue('accept_players');

            const teams = parseInt(teamsStr, 10);
            const players = parseInt(playersStr, 10);

            if (isNaN(players) || isNaN(teams) || players <= 0 || teams <= 0) {
                return interaction.followUp({ content: '⚠️ 人数と組数には1以上の半角数字を入力してください。' });
            }

            const quest = await questDataManager.getQuest(interaction.guildId, questId);
            if (!quest) {
                return interaction.followUp({ content: '⚠️ 対象のクエストが見つかりませんでした。' });
            }

            // 残り枠を確認
            const acceptedPlayers = quest.accepted.reduce((sum, p) => sum + p.players, 0);
            const acceptedTeams = quest.accepted.reduce((sum, p) => sum + p.teams, 0);
            const remainingPlayers = quest.players - acceptedPlayers;
            const remainingTeams = quest.teams - acceptedTeams;

            if (players > remainingPlayers || teams > remainingTeams) {
                 return interaction.followUp({ content: `⚠️ 募集枠を超えています。残り: ${remainingPlayers}人 / ${remainingTeams}組` });
            }

            const newAcceptance = {
                userId: interaction.user.id,
                userTag: interaction.user.tag,
                players,
                teams,
            };

            const updatedAccepted = [...quest.accepted, newAcceptance];
            await questDataManager.updateQuest(interaction.guildId, questId, { accepted: updatedAccepted });

            await logAction(interaction, {
                title: '👍 クエスト受注',
                color: '#2ecc71',
                details: {
                    'クエスト名': quest.name,
                    '受注者': interaction.user.tag,
                    '受注内容': `${teams}組 / ${players}人`,
                    'クエストID': quest.id,
                },
            });

            // ダッシュボードを更新
            await updateDashboard(interaction.client, interaction.guildId);

            await interaction.followUp({ content: `✅ クエスト「${quest.name}」を受注しました。` });
        } catch (error) {
            console.error('クエスト受注処理中にエラーが発生しました:', error);
            await interaction.followUp({ content: '❌ エラーが発生したため、クエストを受注できませんでした。' });
        }
    },
};