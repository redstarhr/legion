const { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType } = require('discord.js');

module.exports = {
    customId: 'setting_set_notification_channel',
    async handle(interaction) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ChannelSelectMenuBuilder()
                    .setCustomId('setting_select_notification_channel')
                    .setPlaceholder('通知を送信するチャンネルを選択')
                    .addChannelTypes([ChannelType.GuildText])
            );

        await interaction.update({
            content: 'クエストの受注・取消などの通知を送信するチャンネルを選択してください。',
            components: [row],
        });
    },
};