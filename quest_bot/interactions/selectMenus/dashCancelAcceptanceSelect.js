// quest_bot/interactions/selectMenus/dashCancelAcceptanceSelect.js
const { MessageFlags, EmbedBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { updateQuestMessage } = require('../../utils/questMessageManager');
const { logAction } = require('../../utils/logger');

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
            const activeAccepted = quest.accepted?.filter(a => a.status !== 'failed') || [];
            const currentAcceptedTeams = activeAccepted.reduce((sum, a) => sum + (a.teams || 0), 0);
            const currentAcceptedPlayers = activeAccepted.reduce((sum, a) => sum + (a.players || a.people || 0), 0);
            const wasFullAndClosed = quest.isClosed && (currentAcceptedTeams >= (quest.teams || 0) && currentAcceptedPlayers >= (quest.players || quest.people || 0));

            // 受注リストから対象のユーザーを削除
            const updatedAccepted = quest.accepted?.filter(a => a.userId !== userId) || [];
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
                    '取消内容': `${acceptance.teams}組 / ${acceptance.players || acceptance.people}人`,
                    'クエストID': quest.id,
                },
            });

            // クエストメッセージとダッシュボードを更新
            const updatedQuest = await questDataManager.getQuest(interaction.guildId, questId);
            await updateQuestMessage(interaction.client, updatedQuest);
            await updateDashboard(interaction.client, interaction.guildId);

            // Send notification
            const notificationChannelId = await questDataManager.getNotificationChannel(interaction.guildId);
            if (notificationChannelId) {
                try {
                    const notificationChannel = await interaction.client.channels.fetch(notificationChannelId);
                    if (notificationChannel?.isTextBased()) {
                        const notificationEmbed = new EmbedBuilder()
                            .setColor(0xf4900c)
                            .setTitle('⚠️ 受注取消通知')
                            .setDescription(`クエスト「${updatedQuest.title || '無題のクエスト'}」の受注が取り消されました。`)
                            .addFields({ name: '取消者', value: interaction.user.tag, inline: true })
                            .setTimestamp();
                        if (wasFullAndClosed) { notificationEmbed.setFooter({ text: 'ℹ️ この取消により、募集が自動的に再開されました。' }); }
                        await notificationChannel.send({ embeds: [notificationEmbed] });
                    }
                } catch (error) { console.error(`[${interaction.guildId}] Notification failed for quest cancellation ${questId}:`, error); }
            }

            let replyMessage = `✅ クエスト「${quest.name}」の受注を取り消しました。`;
            if (wasFullAndClosed) { replyMessage += '\nℹ️ 募集が再開されました。'; }

            await interaction.editReply({ content: replyMessage });

        } catch (error) {
            console.error('受注取消処理中にエラーが発生しました:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: '❌ エラーが発生したため、受注を取り消しできませんでした。' }).catch(console.error);
            } else {
                await interaction.reply({ content: '❌ エラーが発生したため、受注を取り消しできませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
            }
        }
    },
};