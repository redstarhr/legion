// quest_bot/interactions/buttons/dash_open_addQuestSelect.js
const { ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');

module.exports = {
    customId: 'dash_open_addQuestSelect',
    async handle(interaction) {
        // 1. 権限チェック (クエスト作成者ロール or 管理者)
        if (!(await hasQuestManagerPermission(interaction))) {
            return interaction.reply({
                content: 'クエストを追加する権限がありません。',
                flags: MessageFlags.Ephemeral,
            });
        }

        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // 2. UIの作成 (プラの人数選択)
            const numberOptions = Array.from({ length: 25 }, (_, i) => ({
                label: `${i}人`,
                value: `${i}`,
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`dash_select_addQuest_pra_${interaction.id}`)
                .setPlaceholder('プラの人数を選択してください')
                .addOptions(numberOptions);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.editReply({
                content: '1. **プラ**の募集人数を選択してください。\n（両方0人を選択するとキャンセルされます）',
                components: [row],
            });
        } catch (error) {
            console.error('クエスト追加UIの表示中にエラーが発生しました:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: '❌ エラーが発生したため、UIを表示できませんでした。' }).catch(console.error);
            }
        }
    },
};