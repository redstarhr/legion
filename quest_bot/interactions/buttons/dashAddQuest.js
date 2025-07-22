// quest_bot/interactions/buttons/dashAddQuest.js
const { ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');

module.exports = {
    customId: 'dash_open_addQuestSelect',
    async handle(interaction) {
        try {
            const isManager = await hasQuestManagerPermission(interaction);
            if (!isManager) {
                return interaction.reply({ content: 'クエストの追加は、管理者またはクエスト管理者ロールを持つユーザーのみが行えます。', flags: [MessageFlags.Ephemeral] });
            }

            const numberOptions = Array.from({ length: 25 }, (_, i) => ({
                label: `${i}人`,
                value: `${i}`,
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`dash_select_addQuest_pra_${interaction.id}`)
                .setPlaceholder('プラの人数を選択してください')
                .addOptions(numberOptions);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({
                content: '1. **プラ**の募集人数を選択してください。',
                components: [row],
                flags: MessageFlags.Ephemeral,
            });
        } catch (error) {
            console.error('クエスト追加UIの表示中にエラーが発生しました:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'エラーが発生したため、UIを表示できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
            }
        }
    },
};