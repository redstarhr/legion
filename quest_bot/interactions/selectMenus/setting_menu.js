const { ActionRowBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ChannelType, MessageFlags } = require('discord.js');

module.exports = {
    customId: 'setting_menu',
    async handle(interaction) {
        try {
            const selectedValue = interaction.values[0];

            if (selectedValue === 'set_log_channel') {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ChannelSelectMenuBuilder()
                            .setCustomId('setting_select_log_channel')
                            .setPlaceholder('ログを送信するチャンネルを選択')
                            .addChannelTypes([ChannelType.GuildText])
                            .setMinValues(1)
                            .setMaxValues(1)
                    );

                await interaction.update({
                    content: 'ログチャンネルとして設定したいテキストチャンネルを選択してください。',
                    components: [row],
                });
            } else if (selectedValue === 'set_manager_role') {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new RoleSelectMenuBuilder()
                            .setCustomId('setting_select_manager_role')
                            .setPlaceholder('管理者として設定するロールを選択')
                            .setMinValues(1)
                            .setMaxValues(1)
                    );

                await interaction.update({
                    content: 'クエスト管理者として設定したいロールを選択してください。',
                    components: [row],
                });
            } else if (selectedValue === 'set_notification_channel') {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ChannelSelectMenuBuilder()
                            .setCustomId('setting_select_notification_channel')
                            .setPlaceholder('通知を送信するチャンネルを選択')
                            .addChannelTypes([ChannelType.GuildText])
                            .setMinValues(1)
                            .setMaxValues(1)
                    );

                await interaction.update({
                    content: 'クエストの受注・取消などの通知を送信するチャンネルを選択してください。',
                    components: [row],
                });
            }
        } catch (error) {
            console.error('設定メニューの処理中にエラーが発生しました:', error);
            await interaction.followUp({ content: 'エラーが発生したため、操作を続行できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
        }
    },
};