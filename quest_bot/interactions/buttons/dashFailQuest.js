// quest_bot/interactions/buttons/dashFailQuest.js
const { ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');

module.exports = {
    customId: 'dash_open_failQuestSelect',
    async handle(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const allAccepted = await questDataManager.getActiveAcceptances(interaction.guildId);
            if (allAccepted.length === 0) {
                return interaction.editReply({ content: '現在、受注されているクエストはありません。' });
            }

            const acceptanceOptions = allAccepted.map(acc => ({
                label: `[${acc.questName}] ${acc.userTag}`,
                description: `${acc.teams}組 / ${acc.players}人`,
                value: `${acc.questId}_${acc.userId}`,
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`dash_select_failQuest_${interaction.id}`)
                .setPlaceholder('失敗した受注エントリーを選択してください')
                .addOptions(acceptanceOptions.slice(0, 25));

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.editReply({
                content: 'どのクエストの失敗を報告しますか？',
                components: [row],
            });
        } catch (error) {
            console.error('失敗報告UIの表示中にエラーが発生しました:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: '❌ エラーが発生したため、UIを表示できませんでした。' }).catch(console.error);
            } else {
                await interaction.reply({ content: '❌ エラーが発生したため、UIを表示できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
            }
        }
    },
};