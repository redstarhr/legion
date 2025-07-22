// quest_bot/interactions/selectMenus/dashCancelAcceptanceSelect.js
const questDataManager = require('../../utils/questDataManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');

module.exports = {
    customId: 'cancel_acceptance_select_', // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const questId = interaction.values[0];
            const userId = interaction.user.id;

            const quest = await questDataManager.getQuest(interaction.guildId, questId);
            if (!quest) {
                return interaction.followUp({ content: '⚠️ 対象のクエストが見つかりませんでした。' });
            }

            const acceptance = quest.accepted.find(a => a.userId === userId);
            if (!acceptance) {
                return interaction.followUp({ content: '⚠️ 対象の受注情報が見つかりませんでした。既に取り消し済みの可能性があります。' });
            }

            // 受注リストから対象のユーザーを削除
            const updatedAccepted = quest.accepted.filter(a => a.userId !== userId);
            await questDataManager.updateQuest(interaction.guildId, questId, { accepted: updatedAccepted }, interaction.user);

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

            // ダッシュボードを更新
            await updateDashboard(interaction.client, interaction.guildId);

            await interaction.followUp({ content: `✅ クエスト「${quest.name}」の受注を取り消しました。` });

        } catch (error) {
            console.error('受注取消処理中にエラーが発生しました:', error);
            await interaction.followUp({ content: '❌ エラーが発生したため、受注を取り消しできませんでした。' });
        }
    },
};