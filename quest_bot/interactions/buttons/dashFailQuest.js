// quest_bot/interactions/buttons/dashFailQuest.js
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');

module.exports = {
    customId: 'dash_open_failQuestSelect',
    async handle(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const allQuests = await questDataManager.getAllQuests(interaction.guildId);
            const activeQuests = Object.values(allQuests).filter(q => !q.isArchived);

            const allAccepted = activeQuests.flatMap(quest =>
                quest.accepted
                    .filter(acceptance => acceptance.status !== 'failed') // 失敗報告済みのユーザーは除外
                    .map(acceptance => ({
                        questId: quest.id,
                        questName: quest.name,
                        ...acceptance,
                    }))
            );

            if (allAccepted.length === 0) {
                return interaction.followUp({ content: '現在、受注されているクエストはありません。' });
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

            await interaction.followUp({
                content: 'どのクエストの失敗を報告しますか？',
                components: [row],
            });
        } catch (error) {
            console.error('失敗報告UIの表示中にエラーが発生しました:', error);
            await interaction.followUp({ content: '❌ エラーが発生したため、UIを表示できませんでした。' });
        }
    },
};