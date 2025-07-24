const { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType } = require('discord.js');

module.exports = {
    customId: 'setting_set_log_channel',
    async handle(interaction) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ChannelSelectMenuBuilder()
                    .setCustomId('setting_select_log_channel')
                    .setPlaceholder('ログを送信するチャンネルを選択')
                    .addChannelTypes([ChannelType.GuildText])
            );

        await interaction.update({
            content: 'Botの操作ログを出力するテキストチャンネルを選択してください。',
            components: [row],
        });
    },
};