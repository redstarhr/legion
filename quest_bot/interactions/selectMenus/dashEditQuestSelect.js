// quest_bot/interactions/selectMenus/dashEditQuestSelect.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');

module.exports = {
    customId: 'dash_select_editQuest_', // Prefix match
    async handle(interaction) {
        try {
            const questId = interaction.values[0];
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!quest) {
                return interaction.reply({ content: '⚠️ 選択されたクエストが見つかりませんでした。ダッシュボードが更新されるまでお待ちください。', ephemeral: true });
            }

            const modal = new ModalBuilder()
                .setCustomId(`dash_submit_editQuestModal_${questId}_${interaction.id}`)
                .setTitle(`クエスト修正: ${quest.name}`);

            const nameInput = new TextInputBuilder()
                .setCustomId('quest_name')
                .setLabel('クエスト名 (例: プラ, カマ)')
                .setStyle(TextInputStyle.Short)
                .setValue(quest.name)
                .setRequired(true);

            const playersInput = new TextInputBuilder()
                .setCustomId('quest_players')
                .setLabel('募集人数 (半角数字)')
                .setStyle(TextInputStyle.Short)
                .setValue(String(quest.players))
                .setRequired(true);

            const teamsInput = new TextInputBuilder()
                .setCustomId('quest_teams')
                .setLabel('募集組数 (半角数字)')
                .setStyle(TextInputStyle.Short)
                .setValue(String(quest.teams))
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(playersInput),
                new ActionRowBuilder().addComponents(teamsInput)
            );

            await interaction.showModal(modal);
        } catch (error) {
            console.error('クエスト修正モーダルの表示中にエラーが発生しました:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'エラーが発生したため、UIを表示できませんでした。', ephemeral: true });
            }
        }
    },
};