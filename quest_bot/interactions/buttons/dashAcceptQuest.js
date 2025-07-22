// quest_bot/interactions/buttons/dashAcceptQuest.js
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');

module.exports = {
    customId: 'dash_accept_quest',
    async handle(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const allQuests = await questDataManager.getAllQuests(interaction.guildId);
            const activeQuests = Object.values(allQuests).filter(q => !q.isArchived);

            if (activeQuests.length === 0) {
                return interaction.followUp({ content: '現在、受注可能なクエストはありません。' });
            }

            const questOptions = activeQuests.map(quest => ({
                label: quest.name,
                description: `募集: ${quest.players}人 / ${quest.teams}組`,
                value: quest.id,
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`accept_quest_select_${interaction.id}`)
                .setPlaceholder('受注するクエストを選択してください')
                .addOptions(questOptions.slice(0, 25)); // Discordのセレクトメニューは25個まで

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.followUp({
                content: 'どのクエストを受注しますか？',
                components: [row],
            });
        } catch (error) {
            console.error('クエスト受注UIの表示中にエラーが発生しました:', error);
            await interaction.followUp({ content: '❌ エラーが発生したため、UIを表示できませんでした。' });
        }
    },
};