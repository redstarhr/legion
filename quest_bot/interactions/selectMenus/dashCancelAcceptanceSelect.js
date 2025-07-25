// quest_bot/interactions/selectMenus/dashCancelAcceptanceSelect.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../../manager/questDataManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { updateQuestMessage } = require('../../utils/questMessageManager');
const { logAction } = require('../../utils/logger');
const { calculateRemainingSlots } = require('../../utils/questUtils');
const { sendCancellationNotification } = require('../../utils/notificationManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
    customId: 'dash_select_cancelAcceptance_', // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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
            const { currentAcceptedTeams, currentAcceptedPeople } = calculateRemainingSlots(quest);
            const wasFullAndClosed = quest.isClosed && (currentAcceptedTeams >= (quest.teams || 1) && currentAcceptedPlayers >= (quest.people || quest.players || 1));

            // 受注リストから対象のユーザーを削除
            const updatedAccepted = quest.accepted?.filter(a => a.userId !== userId) || [];
            const updates = {
                accepted: updatedAccepted,
                isClosed: wasFullAndClosed ? false : quest.isClosed,
            };
            const updatedQuest = await questDataManager.updateQuest(interaction.guildId, questId, updates, interaction.user);

            await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
                title: '↩️ 受注取消',
                color: '#e67e22', // orange
                details: {
                    'クエスト名': quest.name,
                    '取消者': interaction.user.tag,
                    '取消内容': `${acceptance.teams}組 / ${acceptance.players || acceptance.people}人`,
                    'クエストID': quest.id,
                },
            });

            // クエストメッセージとダッシュボードを更新
            await updateQuestMessage(interaction.client, updatedQuest);
            await updateDashboard(interaction.client, interaction.guildId);

            // 通知を送信
            await sendCancellationNotification({ interaction, quest: updatedQuest, wasFull: wasFullAndClosed });

            let replyMessage = `✅ クエスト「${quest.name}」の受注を取り消しました。`;
            if (wasFullAndClosed) { replyMessage += '\nℹ️ 募集が再開されました。'; }

            await interaction.editReply({ content: replyMessage });

        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ダッシュボードからの受注取消' });
        }
    },
};