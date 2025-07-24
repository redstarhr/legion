// quest_bot/interactions/buttons/dash_open_addQuestSelect.js
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');
const { handleInteractionError } = require('../../../interactionErrorLogger');

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
            // 2. UIの作成 (モーダル)
            const modal = new ModalBuilder()
                .setCustomId(`dash_submit_addQuest_${interaction.id}`)
                .setTitle('クエスト一括追加');

            const praInput = new TextInputBuilder()
                .setCustomId('pra_count')
                .setLabel('プラの募集人数')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('0〜24の数字を入力')
                .setValue('0')
                .setRequired(true);

            const kamaInput = new TextInputBuilder()
                .setCustomId('kama_count')
                .setLabel('カマの募集人数')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('0〜24の数字を入力')
                .setValue('0')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(praInput), new ActionRowBuilder().addComponents(kamaInput));

            await interaction.showModal(modal);
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'クエスト追加モーダル表示' });
        }
    },
};