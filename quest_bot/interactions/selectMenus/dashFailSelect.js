// quest_bot/interactions/selectMenus/dashFailSelect.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { updateQuestMessage } = require('../../utils/questMessageManager');
const { logAction } = require('../../utils/logger');
const { handleInteractionError } = require('../../../interactionErrorLogger');

module.exports = {
    customId: 'dash_select_failQuest_', // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

            const [questId, userId] = interaction.values[0].split('_');

            const quest = await questDataManager.getQuest(interaction.guildId, questId);
            if (!quest) {
                return interaction.editReply({ content: '⚠️ 対象のクエストが見つかりませんでした。' });
            }

            const acceptance = quest.accepted.find(a => a.userId === userId);
            if (!acceptance) {
                return interaction.editReply({ content: '⚠️ 対象の受注情報が見つかりませんでした。既に報告済みの可能性があります。' });
            }

            // 受注リストから対象のユーザーを削除する代わりに、ステータスを更新
            const acceptanceIndex = quest.accepted.findIndex(a => a.userId === userId);
            if (acceptanceIndex === -1) {
                return interaction.editReply({ content: '⚠️ 対象の受注情報が見つかりませんでした。' });
            }
            const updatedAccepted = [...quest.accepted];
            updatedAccepted[acceptanceIndex].status = 'failed';

            const updatedQuest = await questDataManager.updateQuest(interaction.guildId, questId, { accepted: updatedAccepted }, interaction.user);

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

            // クエストメッセージとダッシュボードを更新
            await updateQuestMessage(interaction.client, updatedQuest);
            await updateDashboard(interaction.client, interaction.guildId);

            await interaction.editReply({ content: `✅ クエスト「${quest.name}」における ${acceptance.userTag} さんの失敗を報告しました。` });

        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ダッシュボードからの失敗報告' });
        }
    },
};