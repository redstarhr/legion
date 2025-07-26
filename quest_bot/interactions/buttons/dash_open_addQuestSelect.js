// quest_bot/interactions/buttons/dash_open_addQuestSelect.js
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const { canManageQuests } = require('../../../manager/permissionManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { DASH_ADD_QUEST_MODAL, DASH_ADD_PRA_INPUT, DASH_ADD_KAMA_INPUT } = require('../utils/customIds');

module.exports = {
    customId: 'dash_open_addQuestSelect',
    async handle(interaction) {
        // 1. 権限チェック (クエスト作成者ロール or 管理者)
        if (!(await canManageQuests(interaction))) {
            return interaction.reply({
                content: 'クエストを追加する権限がありません。',
                flags: MessageFlags.Ephemeral,
            });
        }

        try {
            // 2. UIの作成 (モーダル)
            const modal = new ModalBuilder()
                .setCustomId(`${DASH_ADD_QUEST_MODAL}${interaction.id}`) // Use interaction.id to make it unique
                .setTitle('クエスト一括追加');

            const praInput = new TextInputBuilder()
                .setCustomId(DASH_ADD_PRA_INPUT)
                .setLabel('プラの募集人数')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('0〜24の数字を入力')
                .setValue('0')
                .setRequired(true);

            const kamaInput = new TextInputBuilder()
                .setCustomId(DASH_ADD_KAMA_INPUT)
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