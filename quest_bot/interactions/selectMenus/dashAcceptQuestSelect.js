// quest_bot/interactions/selectMenus/dashAcceptQuestSelect.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');

module.exports = {
    customId: 'dash_select_acceptQuest_', // Prefix match
    async handle (interaction) {
        try {
            const questId = interaction.values[0];
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!quest) {
                return interaction.reply({ content: '⚠️ 選択されたクエストが見つかりませんでした。ダッシュボードが更新されるまでお待ちください。', ephemeral: true });
            }

            // ユーザーが既にこのクエストを受注しているか確認
            const hasAccepted = quest.accepted.some(a => a.userId === interaction.user.id);
            if (hasAccepted) {
                return interaction.reply({ content: `⚠️ あなたは既にクエスト「${quest.name}」を受注済みです。変更する場合は、一度討伐/失敗報告をしてから再度受注してください。`, ephemeral: true });
            }

            const acceptedPlayers = quest.accepted.reduce((sum, p) => sum + p.players, 0);
            const acceptedTeams = quest.accepted.reduce((sum, p) => sum + p.teams, 0);
            const remainingPlayers = quest.players - acceptedPlayers;
            const remainingTeams = quest.teams - acceptedTeams;

            const modal = new ModalBuilder()
                .setCustomId(`dash_submit_acceptQuestModal_${questId}_${interaction.id}`)
                .setTitle(`クエスト受注: ${quest.name}`);

            const teamsInput = new TextInputBuilder()
                .setCustomId('accept_teams')
                .setLabel(`受注する組数 (残り: ${remainingTeams}組)`)
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const playersInput = new TextInputBuilder()
                .setCustomId('accept_players')
                .setLabel(`受注する人数 (残り: ${remainingPlayers}人)`)
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(teamsInput),
                new ActionRowBuilder().addComponents(playersInput)
            );

            await interaction.showModal(modal);
        } catch (error) {
            console.error('クエスト受注モーダルの表示中にエラーが発生しました:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'エラーが発生したため、UIを表示できませんでした。', ephemeral: true });
            }
        }
    },
};