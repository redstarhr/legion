// quest_bot/interactions/buttons/dashArchiveQuest.js
const { ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');

module.exports = {
    customId: 'dash_open_archiveQuestSelect',
    async handle(interaction) {
        try {
            const isManager = await hasQuestManagerPermission(interaction);
            if (!isManager) {
                return interaction.reply({ content: 'クエストの完了は、管理者またはクエスト管理者ロールを持つユーザーのみが行えます。', flags: MessageFlags.Ephemeral });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const allQuests = await questDataManager.getAllQuests(interaction.guildId);
            const activeQuests = Object.values(allQuests).filter(q => !q.isArchived);

            if (activeQuests.length === 0) {
                return interaction.editReply({ content: '現在、完了できるクエストはありません。' });
            }

            const questOptions = activeQuests.map(quest => ({
                label: quest.name,
                description: `ID: ${quest.id}`,
                value: quest.id,
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`dash_select_archiveQuest_${interaction.id}`)
                .setPlaceholder('完了（アーカイブ）するクエストを選択してください')
                .addOptions(questOptions.slice(0, 25));

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.editReply({
                content: 'どのクエストを完了状態にしますか？完了したクエストは、`/完了クエスト一覧` から確認できます。',
                components: [row],
            });
        } catch (error) {
            console.error('クエスト完了UIの表示中にエラーが発生しました:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: '❌ エラーが発生したため、UIを表示できませんでした。' }).catch(console.error);
            }
        }
    },
};