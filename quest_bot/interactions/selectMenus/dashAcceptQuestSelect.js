// quest_bot/interactions/selectMenus/dashAcceptQuestSelect.js
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');

module.exports = {
    customId: 'dash_select_acceptQuest_', // Prefix match
    async handle (interaction) {
        try {
            const questId = interaction.values[0];
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!quest) {
                return interaction.update({ content: '⚠️ 選択されたクエストが見つかりませんでした。ダッシュボードが更新されるまでお待ちください。', components: [] });
            }

            // ユーザーが既にこのクエストを受注しているか確認
            const hasAccepted = quest.accepted.some(a => a.userId === interaction.user.id);
            if (hasAccepted) {
                return interaction.update({ content: `⚠️ あなたは既にクエスト「${quest.name}」を受注済みです。変更する場合は、一度討伐/失敗報告をしてから再度受注してください。`, components: [] });
            }

            const acceptedPlayers = quest.accepted.reduce((sum, p) => sum + p.players, 0);
            const acceptedTeams = quest.accepted.reduce((sum, p) => sum + p.teams, 0);
            const remainingPlayers = quest.players - acceptedPlayers;
            const remainingTeams = quest.teams - acceptedTeams;

            if (remainingTeams <= 0 || remainingPlayers <= 0) {
                 return interaction.update({ content: '⚠️ このクエストは既に定員に達しています。', components: [] });
            }

            // 募集中の組数（最大25個）の選択肢を生成
            const teamOptionsCount = Math.min(remainingTeams, 24) + 1; // 0を含むため+1
            const teamOptions = Array.from({ length: teamOptionsCount }, (_, i) => ({
                label: `${i}組`,
                value: `${i}`,
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`dash_select_acceptTeams_${questId}_${interaction.id}`)
                .setPlaceholder('受注する組数を選択してください')
                .addOptions(teamOptions);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.update({
                content: `**クエスト「${quest.name}」を受注します。**\n1. 受注する**組数**を選択してください。`,
                components: [row],
            });
        } catch (error) {
            console.error('クエスト受注UI(1/2)の表示中にエラーが発生しました:', error);
            await interaction.update({ content: 'エラーが発生したため、受注プロセスを開始できませんでした。', components: [] }).catch(console.error);
        }
    },
};