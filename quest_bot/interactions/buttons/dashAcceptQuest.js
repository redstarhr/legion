// quest_bot/interactions/buttons/dashAcceptQuest.js
const { ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');

const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
module.exports = {
    customId: 'dash_open_acceptQuestSelect',
    async handle(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const allQuests = await questDataManager.getAllQuests(interaction.guildId);
            const activeQuests = Object.values(allQuests).filter(q => !q.isArchived);

            if (activeQuests.length === 0) {
                return interaction.editReply({ content: '現在、受注可能なクエストはありません。' });
            }

            const questOptions = activeQuests.map(quest => ({
                label: quest.name,
                description: `募集: ${quest.players}人 / ${quest.teams}組`,
                value: quest.id,
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`dash_select_acceptQuest_${interaction.id}`)
                .setPlaceholder('受注するクエストを選択してください')
                .addOptions(questOptions.slice(0, 25)); // Discordのセレクトメニューは25個まで

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.editReply({
                content: 'どのクエストを受注しますか？',
                components: [row],
            });
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ダッシュボードからのクエスト受注UI表示' });
        }
    },
};