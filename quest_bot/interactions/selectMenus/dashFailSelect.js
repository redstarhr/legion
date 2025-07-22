// quest_bot/interactions/selectMenus/dashFailSelect.js
const questDataManager = require('../../utils/questDataManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');

module.exports = {
    customId: 'fail_quest_select_', // Prefix match
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

            // 受注リストから対象のユーザーを削除する代わりに、ステータスを更新
            const acceptanceIndex = quest.accepted.findIndex(a => a.userId === userId);
            if (acceptanceIndex === -1) {
                return interaction.followUp({ content: '⚠️ 対象の受注情報が見つかりませんでした。' });
            }
            const updatedAccepted = [...quest.accepted];
            updatedAccepted[acceptanceIndex].status = 'failed';

            await questDataManager.updateQuest(interaction.guildId, questId, { accepted: updatedAccepted }, interaction.user);

            await logAction(interaction, {
                title: '❌ 討伐失敗',
                color: '#e74c3c', // red
                details: {
                    'クエスト名': quest.name,
                    '報告者': interaction.user.tag,
                    '対象者': acceptance.userTag,
                    '受注内容': `${acceptance.teams}組 / ${acceptance.players}人`,
                    'クエストID': quest.id,
                },
            });

            // ダッシュボードを更新
            await updateDashboard(interaction.client, interaction.guildId);

            await interaction.followUp({ content: `✅ クエスト「${quest.name}」における ${acceptance.userTag} さんの失敗を報告しました。` });

        } catch (error) {
            console.error('討伐失敗処理中にエラーが発生しました:', error);
            await interaction.followUp({ content: '❌ エラーが発生したため、討伐失敗を報告できませんでした。' });
        }
    },
};