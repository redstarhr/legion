// quest_bot/interactions/modals/dashEditQuestModal.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');

module.exports = {
    customId: 'dash_submit_editQuestModal_', // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

            const [,,, questId] = interaction.customId.split('_');

            const name = interaction.fields.getTextInputValue('quest_name');
            const playersStr = interaction.fields.getTextInputValue('quest_players');
            const teamsStr = interaction.fields.getTextInputValue('quest_teams');

            const players = parseInt(playersStr, 10);
            const teams = parseInt(teamsStr, 10);

            if (isNaN(players) || isNaN(teams) || players < 0 || teams < 0) {
                return interaction.editReply({ content: '⚠️ 人数と組数には0以上の半角数字を入力してください。' });
            }

            const updates = { name, players, teams };
            await questDataManager.updateQuest(interaction.guildId, questId, updates, interaction.user);

            await logAction(interaction, {
                title: '📝 クエスト修正',
                color: '#f1c40f',
                details: {
                    'クエスト名': name,
                    '募集人数': `${players}人`,
                    '募集組数': `${teams}組`,
                    'クエストID': questId,
                },
            });

            // ダッシュボードを更新
            await updateDashboard(interaction.client, interaction.guildId);

            await interaction.editReply({ content: `✅ クエスト「${name}」を修正しました。` });

        } catch (error) {
            console.error('クエスト修正処理中にエラーが発生しました:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: '❌ エラーが発生したため、クエストを修正できませんでした。' }).catch(console.error);
            } else {
                await interaction.reply({ content: '❌ エラーが発生したため、クエストを修正できませんでした。', flags: [MessageFlags.Ephemeral] }).catch(console.error);
            }
        }
    },
};