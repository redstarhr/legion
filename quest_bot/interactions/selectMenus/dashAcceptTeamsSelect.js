// quest_bot/interactions/selectMenus/dashAcceptTeamsSelect.js
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');

module.exports = {
    customId: 'dash_select_acceptTeams_', // Prefix match
    async handle(interaction) {
        try {
            const teamCount = interaction.values[0];
            const questId = interaction.customId.split('_')[3];

            const quest = await questDataManager.getQuest(interaction.guildId, questId);
            if (!quest) {
                return interaction.update({ content: '⚠️ 対象のクエストが見つかりませんでした。', components: [] });
            }

            const acceptedPlayers = quest.accepted.reduce((sum, p) => sum + p.players, 0);
            const remainingPlayers = quest.players - acceptedPlayers;

            const playerOptionsCount = Math.min(remainingPlayers, 24) + 1; // 0を含むため+1
            const playerOptions = Array.from({ length: playerOptionsCount }, (_, i) => ({
                label: `${i}人`,
                value: `${i}`,
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`dash_select_acceptPlayers_${questId}_${teamCount}_${interaction.id}`)
                .setPlaceholder('受注する人数を選択してください')
                .addOptions(playerOptions);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.update({
                content: `**クエスト「${quest.name}」を受注します。**\n2. 受注する**人数**を選択してください。\n（組数: ${teamCount}組）`,
                components: [row],
            });

        } catch (error) {
            console.error('クエスト受注UI(2/2)の表示中にエラーが発生しました:', error);
            await interaction.update({ content: 'エラーが発生しました。もう一度お試しください。', components: [] }).catch(console.error);
        }
    },
};