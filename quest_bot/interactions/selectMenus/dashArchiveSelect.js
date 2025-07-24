// quest_bot/interactions/selectMenus/dashArchiveSelect.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { updateQuestMessage } = require('../../utils/questMessageManager');
const { logAction } = require('../../utils/logger');

module.exports = {
    customId: 'dash_select_archiveQuest_', // Prefix match
    async handle (interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const questId = interaction.values[0];

            const quest = await questDataManager.getQuest(interaction.guildId, questId);
            if (!quest) {
                return interaction.editReply({ content: '⚠️ 対象のクエストが見つかりませんでした。' });
            }

            if (quest.isArchived) {
                return interaction.editReply({ content: '⚠️ このクエストは既に完了（アーカイブ）済みです。' });
            }

            // isArchivedフラグを立て、完了日時を記録
            const updates = {
                isArchived: true,
                completedAt: new Date().toISOString(),
                isClosed: true, // Archiving should also close it
            };
            const updatedQuest = await questDataManager.updateQuest(interaction.guildId, questId, updates, interaction.user);
            if (!updatedQuest) {
                return interaction.editReply({ content: '⚠️ クエストの更新に失敗しました。' });
            }

            await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
                title: '✅ クエスト完了',
                color: '#95a5a6', // grey
                details: {
                    'クエスト名': updatedQuest.name,
                    'クエストID': quest.id,
                },
            });

            // クエストメッセージとダッシュボードを更新
            await updateQuestMessage(interaction.client, updatedQuest);
            await updateDashboard(interaction.client, interaction.guildId);

            await interaction.editReply({ content: `✅ クエスト「${quest.name}」を完了状態にしました。` });

        } catch (error) {
            console.error('クエスト完了処理中にエラーが発生しました:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: '❌ エラーが発生したため、クエストを完了できませんでした。' }).catch(console.error);
            } else {
                await interaction.reply({ content: '❌ エラーが発生したため、クエストを完了できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
            }
        }
    },
};