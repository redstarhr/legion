const { ActionRowBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, StringSelectMenuBuilder, ChannelType, MessageFlags } = require('discord.js');

const colorOptions = [
    { label: 'デフォルト (水色)', value: '#00bfff' },
    { label: '青', value: '#3498db' },
    { label: '緑', value: '#2ecc71' },
    { label: '赤', value: '#e74c3c' },
    { label: '紫', value: '#9b59b6' },
    { label: '黄色', value: '#f1c40f' },
    { label: 'オレンジ', value: '#e67e22' },
    { label: 'ピンク', value: '#e91e63' },
    { label: '白', value: '#ffffff' },
    { label: '黒', value: '#2c2f33' },
];

const buttonOptions = [{ label: '受注する', value: 'accept' },{ label: '受注取消', value: 'cancel' },{ label: '編集', value: 'edit' },{ label: '参加者に連絡', value: 'dm' }];

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
            } else if (selectedValue === 'set_dashboard_channel') {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ChannelSelectMenuBuilder()
                            .setCustomId('setting_select_dashboard_channel')
                            .setPlaceholder('掲示板を設置/移動するチャンネルを選択')
                            .addChannelTypes([ChannelType.GuildText])
                            .setMinValues(1)
                            .setMaxValues(1)
                    );
                await interaction.update({
                    content: 'クエスト掲示板を設置/移動するチャンネルを選択してください。\n既存の掲示板は削除され、新しい場所に再設置されます。',
                    components: [row],
                });
            } else if (selectedValue === 'set_embed_color') {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('setting_select_embed_color')
                            .setPlaceholder('クエストメッセージのEmbedの色を選択')
                            .addOptions(colorOptions)
                    );
                await interaction.update({
                    content: 'クエストメッセージの左側に表示される色を選択してください。',
                    components: [row],
                });
            } else if (selectedValue === 'set_button_order') {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('setting_select_button_order_1')
                            .setPlaceholder('1番目に表示するボタンを選択')
                            .addOptions(buttonOptions)
                    );
                await interaction.update({
                    content: 'クエストメッセージのボタンの表示順を1つずつ選択してください。\n\n**1番目**に表示するボタンを選択してください:',
                    components: [row],
                });
            }
        } catch (error) {
            console.error('設定メニューの処理中にエラーが発生しました:', error);
            await interaction.followUp({ content: 'エラーが発生したため、操作を続行できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
        }
    },
};