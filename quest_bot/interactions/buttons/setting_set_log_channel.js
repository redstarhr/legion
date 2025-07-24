const { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    customId: 'setting_set_log_channel',
    async handle(interaction) {
        const selectMenu = new ChannelSelectMenuBuilder()
            .setCustomId('setting_select_log_channel')
            .setPlaceholder('ログを送信するチャンネルを選択')
            .addChannelTypes([ChannelType.GuildText]);

        const removeButton = new ButtonBuilder()
            .setCustomId('setting_remove_log_channel')
            .setLabel('設定を解除')
            .setStyle(ButtonStyle.Danger);

        const row1 = new ActionRowBuilder().addComponents(selectMenu);
        const row2 = new ActionRowBuilder().addComponents(removeButton);

        await interaction.update({
            content: 'Botの操作ログを出力するテキストチャンネルを選択するか、設定を解除してください。',
            components: [row1, row2],
        });
    },
};