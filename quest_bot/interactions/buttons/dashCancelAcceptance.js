// quest_bot/interactions/buttons/dashCancelAcceptance.js
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');

module.exports = {
    customId: 'dash_open_cancelAcceptanceSelect',
    async handle(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const allQuests = await questDataManager.getAllQuests(interaction.guildId);
            const activeQuests = Object.values(allQuests).filter(q => !q.isArchived);

            const myAcceptances = activeQuests.flatMap(quest =>
                quest.accepted
                    .filter(acceptance => acceptance.userId === interaction.user.id && acceptance.status !== 'failed')
                    .map(acceptance => ({
                        questId: quest.id,
                        questName: quest.name,
                        ...acceptance,
                    }))
            );

            if (myAcceptances.length === 0) {
                return interaction.followUp({ content: '現在、あなたが受注しているクエストはありません。' });
            }

            const acceptanceOptions = myAcceptances.map(acc => ({
                label: `[${acc.questName}]`,
                description: `あなたの受注: ${acc.teams}組 / ${acc.players}人`,
                value: acc.questId,
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`dash_select_cancelAcceptance_${interaction.id}`)
                .setPlaceholder('取り消す受注を選択してください')
                .addOptions(acceptanceOptions.slice(0, 25));

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.followUp({
                content: 'どのクエストの受注を取り消しますか？',
                components: [row],
            });
        } catch (error) {
            console.error('受注取消UIの表示中にエラーが発生しました:', error);
            await interaction.followUp({ content: '❌ エラーが発生したため、UIを表示できませんでした。' });
        }
    },
};