// quest_bot/interactions/buttons/dashCompleteQuest.js
const { ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const questDataManager = require('../../../manager/questDataManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
    customId: 'dash_open_completeQuestSelect',
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
                .setCustomId(`dash_select_completeQuest_${interaction.id}`)
                .setPlaceholder('討伐完了した受注エントリーを選択してください')
                .addOptions(acceptanceOptions.slice(0, 25));

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.editReply({
                content: '誰のクエスト討伐を報告しますか？',
                components: [row],
            });
        } catch (error) {
            await handleInteractionError({ interaction, error, context: '討伐報告UI表示' });
        }
    },
};