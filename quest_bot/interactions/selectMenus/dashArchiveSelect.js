// quest_bot/interactions/selectMenus/dashArchiveSelect.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { updateDashboard } = require('../../utils/dashboardManager');
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

            // isArchivedフラグを立て、完了日時を記録
            const updates = {
                isArchived: true,
                completedAt: new Date().toISOString(),
            };
            await questDataManager.updateQuest(interaction.guildId, questId, updates, interaction.user);

            await logAction(interaction, {
                title: '✅ クエスト完了',
                color: '#95a5a6', // grey
                details: {
                    'クエスト名': quest.name,
                    'クエストID': quest.id,
                },
            });

            // ダッシュボードを更新
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