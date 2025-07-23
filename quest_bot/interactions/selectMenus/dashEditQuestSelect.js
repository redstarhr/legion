// quest_bot/interactions/selectMenus/dashEditQuestSelect.js
const { ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');

module.exports = {
    customId: 'dash_select_editQuest_', // Prefix match
    async handle(interaction) {
        try {
            const questId = interaction.values[0];
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!quest) {
                return interaction.update({ content: '⚠️ 選択されたクエストが見つかりませんでした。ダッシュボードが更新されるまでお待ちください。', components: [] });
            }

            const numberOptions = Array.from({ length: 25 }, (_, i) => ({
                label: `${i}人`,
                value: `${i}`,
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`dash_select_editPlayers_${questId}_${interaction.id}`)
                .setPlaceholder('新しい募集人数を選択してください')
                .addOptions(numberOptions);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.update({
                content: `**クエスト「${quest.name}」の募集人数を修正します。**\n新しい人数を選択してください。`,
                components: [row],
            });

        } catch (error) {
            console.error('クエスト修正UI(1/2)の表示中にエラーが発生しました:', error);
            await interaction.update({ content: 'エラーが発生したため、UIを表示できませんでした。', components: [] }).catch(console.error);
        }
    },
};