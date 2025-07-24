const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const configDataManager = require('../../../configDataManager');
const { logAction } = require('../../utils/logger');
const { createConfigPanel } = require('../../components/configPanel');

const { handleInteractionError } = require('../../../interactionErrorLogger');
const allButtonOptions = [
    { label: '受注する', value: 'accept' }, { label: '受注取消', value: 'cancel' },
    { label: '編集', value: 'edit' }, { label: '参加者に連絡', value: 'dm' },
];
const buttonNameMap = { accept: '受注', cancel: '受注取消', edit: '編集', dm: '参加者に連絡' };

module.exports = {
    customId: 'setting_select_button_order_', // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferUpdate();
            const parts = interaction.customId.split('_');
            const currentStep = parseInt(parts[4], 10);
            const selectedOrder = parts.length > 5 ? parts.slice(5) : [];
            const newSelection = interaction.values[0];
            selectedOrder.push(newSelection);

            const nextStep = currentStep + 1;

            if (nextStep <= 4) {
                const remainingOptions = allButtonOptions.filter(opt => !selectedOrder.includes(opt.value));
                const newCustomId = `setting_select_button_order_${nextStep}_${selectedOrder.join('_')}`;
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(newCustomId)
                    .setPlaceholder(`${nextStep}番目に表示するボタンを選択してください`)
                    .addOptions(remainingOptions);
                const row = new ActionRowBuilder().addComponents(selectMenu);
                const friendlyOrder = selectedOrder.map(key => `\`${buttonNameMap[key]}\``).join(' > ');
                await interaction.editReply({
                    content: `現在の選択: ${friendlyOrder}\n\n**${nextStep}番目**に表示するボタンを選択してください:`,
                    components: [row],
                });
            } else {
                const successMessage = `✅ ボタンの表示順を **${selectedOrder.map(key => `\`${buttonNameMap[key]}\``).join(' > ')}** に設定しました。`;
                await configDataManager.setButtonOrder(interaction.guildId, selectedOrder);
                await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
                    title: '⚙️ ボタン順設定',
                    description: successMessage,
                    color: '#95a5a6',
                });
                const newView = await createConfigPanel(interaction);
                await interaction.editReply({ content: successMessage, ...newView });
            }
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ボタン順設定' });
        }
    },
};