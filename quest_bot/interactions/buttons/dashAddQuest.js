// quest_bot/interactions/buttons/dashAddQuest.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');

module.exports = {
    customId: 'dash_open_addQuestModal',
    async handle(interaction) {
        try {
            const isManager = await hasQuestManagerPermission(interaction);
            if (!isManager) {
                return interaction.reply({ content: 'クエストの追加は、管理者またはクエスト管理者ロールを持つユーザーのみが行えます。', ephemeral: true });
            }

            const modal = new ModalBuilder()
                .setCustomId(`dash_submit_addQuestModal_${interaction.id}`)
                .setTitle('新規クエストの追加');

            const nameInput = new TextInputBuilder()
                .setCustomId('quest_name')
                .setLabel('クエスト名 (例: プラ, カマ)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const playersInput = new TextInputBuilder()
                .setCustomId('quest_players')
                .setLabel('募集人数 (半角数字)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const teamsInput = new TextInputBuilder()
                .setCustomId('quest_teams')
                .setLabel('募集組数 (半角数字)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(playersInput),
                new ActionRowBuilder().addComponents(teamsInput)
            );

            await interaction.showModal(modal);
        } catch (error) {
            console.error('クエスト追加モーダルの表示中にエラーが発生しました:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'エラーが発生したため、UIを表示できませんでした。', ephemeral: true });
            }
        }
    },
};