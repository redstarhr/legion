// quest_bot/interactions/selectMenus/dashCompleteSelect.js
const questDataManager = require('../../utils/questDataManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');

module.exports = {
    customId: 'complete_quest_select_', // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const [questId, userId] = interaction.values[0].split('_');

            const quest = await questDataManager.getQuest(interaction.guildId, questId);
            if (!quest) {
                return interaction.followUp({ content: '⚠️ 対象のクエストが見つかりませんでした。' });
            }

            const acceptance = quest.accepted.find(a => a.userId === userId);
            if (!acceptance) {
                return interaction.followUp({ content: '⚠️ 対象の受注情報が見つかりませんでした。既に報告済みの可能性があります。' });
            }

            // 受注リストから対象のユーザーを削除
            const updatedAccepted = quest.accepted.filter(a => a.userId !== userId);
            await questDataManager.updateQuest(interaction.guildId, questId, { accepted: updatedAccepted }, interaction.user);

            await logAction(interaction, {
                title: '🏆 討伐完了',
                color: '#f1c40f', // yellow
                details: {
                    'クエスト名': quest.name,
                    '報告者': interaction.user.tag,
                    '完了者': acceptance.userTag,
                    '討伐内容': `${acceptance.teams}組 / ${acceptance.players}人`,
                    'クエストID': quest.id,
                },
            });

            // ダッシュボードを更新
            await updateDashboard(interaction.client, interaction.guildId);

            await interaction.followUp({ content: `✅ クエスト「${quest.name}」における ${acceptance.userTag} さんの討伐完了を報告しました。` });

        } catch (error) {
            console.error('討伐完了処理中にエラーが発生しました:', error);
            await interaction.followUp({ content: '❌ エラーが発生したため、討伐完了を報告できませんでした。' });
        }
    },
};