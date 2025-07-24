const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const buttonOptions = [
    { label: '受注する', value: 'accept' }, { label: '受注取消', value: 'cancel' },
    { label: '編集', value: 'edit' }, { label: '参加者に連絡', value: 'dm' },
];

module.exports = {
    customId: 'setting_set_button_order',
    async handle(interaction) {
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('setting_select_button_order_1') // Handled by setting_select_button_order.js
                    .setPlaceholder('1番目に表示するボタンを選択')
                    .addOptions(buttonOptions)
            );
        await interaction.update({
            content: 'クエストメッセージのボタンの表示順を1つずつ選択してください。\n\n**1番目**に表示するボタンを選択してください:',
            components: [row],
        });
    },
};