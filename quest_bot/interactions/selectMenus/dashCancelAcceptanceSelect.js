// quest_bot/interactions/selectMenus/dashCancelAcceptanceSelect.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { updateQuestMessage } = require('../../utils/questMessageManager');
const { logAction } = require('../../utils/logger');

module.exports = {
    customId: 'dash_select_cancelAcceptance_', // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

            const questId = interaction.values[0];
            const userId = interaction.user.id;

            const quest = await questDataManager.getQuest(interaction.guildId, questId);
            if (!quest) {
                return interaction.editReply({ content: '⚠️ 対象のクエストが見つかりませんでした。' });
            }

            const acceptance = quest.accepted.find(a => a.userId === userId);
            if (!acceptance) {
                return interaction.editReply({ content: '⚠️ 対象の受注情報が見つかりませんでした。既に取り消し済みの可能性があります。' });
            }

            // Check if the quest was full before cancellation
            const currentAcceptedTeams = quest.accepted.reduce((sum, a) => sum + a.teams, 0);
            const currentAcceptedPlayers = quest.accepted.reduce((sum, a) => sum + a.players, 0);
            const wasFullAndClosed = quest.isClosed && (currentAcceptedTeams >= quest.teams && currentAcceptedPlayers >= quest.players);

            // 受注リストから対象のユーザーを削除
            const updatedAccepted = quest.accepted.filter(a => a.userId !== userId);
            const updates = {
                accepted: updatedAccepted,
                isClosed: wasFullAndClosed ? false : quest.isClosed,
            };
            await questDataManager.updateQuest(interaction.guildId, questId, updates, interaction.user);

            await logAction(interaction, {
                title: '↩️ 受注取消',
                color: '#e67e22', // orange
                details: {
                    'クエスト名': quest.name,
                    '取消者': interaction.user.tag,
                    '取消内容': `${acceptance.teams}組 / ${acceptance.players}人`,
                    'クエストID': quest.id,
                },
            });

            // クエストメッセージとダッシュボードを更新
            const updatedQuest = await questDataManager.getQuest(interaction.guildId, questId);
            await updateQuestMessage(interaction.client, updatedQuest);
            await updateDashboard(interaction.client, interaction.guildId);

            let replyMessage = `✅ クエスト「${quest.name}」の受注を取り消しました。`;
            if (wasFullAndClosed) { replyMessage += '\nℹ️ 募集が再開されました。'; }

            await interaction.editReply({ content: replyMessage });

        } catch (error) {
            console.error('受注取消処理中にエラーが発生しました:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: '❌ エラーが発生したため、受注を取り消しできませんでした。' }).catch(console.error);
            } else {
                await interaction.reply({ content: '❌ エラーが発生したため、受注を取り消しできませんでした。', flags: [MessageFlags.Ephemeral] }).catch(console.error);
            }
        }
    },
};