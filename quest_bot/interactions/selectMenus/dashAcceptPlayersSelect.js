// quest_bot/interactions/selectMenus/dashAcceptPlayersSelect.js
const questDataManager = require('../../utils/questDataManager');
const { updateQuestMessage } = require('../../utils/questMessageManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');

module.exports = {
    customId: 'dash_select_acceptPlayers_', // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferUpdate();

            const parts = interaction.customId.split('_');
            const questId = parts[3];
            const teams = parseInt(parts[4], 10);
            const players = parseInt(interaction.values[0], 10);

            if (teams === 0 && players === 0) {
                return interaction.editReply({ content: '組数と人数の両方が0のため、受注をキャンセルしました。', components: [] });
            }

            const quest = await questDataManager.getQuest(interaction.guildId, questId);
            if (!quest) {
                return interaction.editReply({ content: '⚠️ 対象のクエストが見つかりませんでした。', components: [] });
            }

            // レースコンディション対策で、再度残り枠をチェック
            const acceptedPlayers = quest.accepted.reduce((sum, p) => sum + p.players, 0);
            const acceptedTeams = quest.accepted.reduce((sum, p) => sum + p.teams, 0);
            const remainingPlayers = quest.players - acceptedPlayers;
            const remainingTeams = quest.teams - acceptedTeams;

            if (players > remainingPlayers || teams > remainingTeams) {
                 return interaction.editReply({ content: `⚠️ 募集枠を超えています。再度お試しください。残り: ${remainingPlayers}人 / ${remainingTeams}組`, components: [] });
            }

            const newAcceptance = {
                userId: interaction.user.id,
                userTag: interaction.user.tag,
                players,
                teams,
            };

            const updatedAccepted = [...quest.accepted, newAcceptance];

            // Check if the quest is now full
            const newTotalTeams = acceptedTeams + teams;
            const newTotalPlayers = acceptedPlayers + players;
            const isNowFull = newTotalTeams >= quest.teams && newTotalPlayers >= quest.players;

            const updates = {
                accepted: updatedAccepted,
                isClosed: isNowFull ? true : quest.isClosed, // Close if full
            };
            await questDataManager.updateQuest(interaction.guildId, questId, updates, interaction.user);

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

            const updatedQuest = await questDataManager.getQuest(interaction.guildId, questId);
            await updateQuestMessage(interaction.client, updatedQuest);
            await updateDashboard(interaction.client, interaction.guildId);

            let replyMessage = `✅ クエスト「${quest.name}」を受注しました。`;
            if (isNowFull) { replyMessage += '\nℹ️ この受注により、募集が定員に達したため自動的に締め切られました。'; }

            await interaction.editReply({ content: replyMessage, components: [] });
        } catch (error) {
            console.error('クエスト受注処理中にエラーが発生しました:', error);
            await interaction.editReply({ content: '❌ エラーが発生したため、クエストを受注できませんでした。', components: [] }).catch(console.error);
        }
    },
};