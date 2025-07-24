const { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    customId: 'setting_set_notification_channel',
    async handle(interaction) {
        const selectMenu = new ChannelSelectMenuBuilder()
            .setCustomId('setting_select_notification_channel')
            .setPlaceholder('通知を送信するチャンネルを選択')
            .addChannelTypes([ChannelType.GuildText]);

        const removeButton = new ButtonBuilder()
            .setCustomId('setting_remove_notification_channel')
            .setLabel('設定を解除')
            .setStyle(ButtonStyle.Danger);

        const row1 = new ActionRowBuilder().addComponents(selectMenu);
        const row2 = new ActionRowBuilder().addComponents(removeButton);

        await interaction.update({
            content: 'クエストの受注・取消などの通知を送信するチャンネルを選択するか、設定を解除してください。',
            components: [row1, row2],
        });
    },
};