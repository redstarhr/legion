// e:/\u5171\u6709\u30d5\u30a9\u30eb\u30c0/legion/quest_bot/interactions/selectMenus/dashAddQuestPraSelect.js

const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    customId: 'dash_select_addQuest_pra_', // Prefix match
    async handle(interaction) {
        try {
            const praCount = interaction.values[0];

            const numberOptions = Array.from({ length: 25 }, (_, i) => ({
                label: `${i}人`,
                value: `${i}`,
            }));

            // Pass the praCount in the customId for the next step
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`dash_select_addQuest_kama_${praCount}_${interaction.id}`)
                .setPlaceholder('カマの人数を選択してください')
                .addOptions(numberOptions);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.update({
                content: `2. **カマ**の募集人数を選択してください。\n（プラ: ${praCount}人）`,
                components: [row],
            });

        } catch (error) {
            console.error('プラ人数選択の処理中にエラーが発生しました:', error);
            await interaction.update({ content: 'エラーが発生しました。もう一度お試しください。', components: [] }).catch(console.error);
        }
    },
};