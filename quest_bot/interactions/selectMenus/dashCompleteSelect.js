// quest_bot/interactions/selectMenus/dashCompleteSelect.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../../manager/questDataManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { updateQuestMessage } = require('../../utils/questMessageManager');
const { logAction } = require('../../utils/logger');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
    customId: 'dash_select_completeQuest_', // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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
            updatedAccepted[acceptanceIndex].status = 'completed';
            const updatedQuest = await questDataManager.updateQuest(interaction.guildId, questId, { accepted: updatedAccepted }, interaction.user);

            await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
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

            // クエストメッセージとダッシュボードを更新
            await updateQuestMessage(interaction.client, updatedQuest);
            await updateDashboard(interaction.client, interaction.guildId);

            await interaction.editReply({ content: `✅ クエスト「${quest.name}」における ${acceptance.userTag} さんの討伐完了を報告しました。` });

        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ダッシュボードからの討伐完了報告' });
        }
    },
};