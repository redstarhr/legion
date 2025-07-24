const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const questDataManager = require('../utils/questDataManager');

const buttonNameMap = {
    accept: '受注',
    cancel: '受注取消',
    edit: '編集',
    dm: '参加者に連絡'
};

async function createConfigPanel(interaction) {
    const guildId = interaction.guildId;

    // Fetch current settings from the data manager
    const logChannelId = await questDataManager.getLogChannel(guildId);
    const notificationChannelId = await questDataManager.getNotificationChannel(guildId);
    const dashboard = await questDataManager.getDashboard(guildId);
    const embedColor = await questDataManager.getEmbedColor(guildId);
    const buttonOrder = await questDataManager.getButtonOrder(guildId);
    const buttonOrderString = buttonOrder.map(key => `\`${buttonNameMap[key] || key}\``).join(' > ');

    const settingsEmbed = new EmbedBuilder()
        .setTitle('⚙️ クエストBot 設定パネル')
        .setColor(embedColor || '#5865F2')
        .setDescription('現在のサーバー設定です。\n下のメニューから変更したい項目を選択してください。')
        .addFields(
            { name: 'ログチャンネル', value: logChannelId ? `<#${logChannelId}>` : '未設定', inline: true },
            { name: '通知チャンネル', value: notificationChannelId ? `<#${notificationChannelId}>` : '未設定', inline: true },
            { name: '掲示板チャンネル', value: dashboard ? `<#${dashboard.channelId}>` : '未設定', inline: true },
            { name: 'Embedカラー', value: `\`${embedColor}\``, inline: true },
            { name: 'ボタン表示順', value: buttonOrderString, inline: false }
        )
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('setting_menu')
                .setPlaceholder('設定項目を選択...')
                .addOptions([
                    {
                        label: 'ログチャンネル設定',
                        description: '各種操作ログを送信するチャンネルを設定します。',
                        value: 'set_log_channel',
                    },
                    {
                        label: '通知チャンネル設定',
                        description: 'クエストの受注・取消等の通知を送信するチャンネルを設定します。',
                        value: 'set_notification_channel',
                    },
                    {
                        label: '掲示板チャンネル設定',
                        description: 'クエスト掲示板を設置/移動するチャンネルを設定します。',
                        value: 'set_dashboard_channel',
                    },
                    {
                        label: 'Embedカラー設定',
                        description: 'クエストメッセージの左側の色を設定します。',
                        value: 'set_embed_color',
                    },
                    {
                        label: 'ボタン表示順設定',
                        description: 'クエストメッセージのメインボタンの表示順を設定します。',
                        value: 'set_button_order',
                    },
                ])
        );

    const removeButtons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('config_remove_log_channel').setLabel('ログ解除').setStyle(ButtonStyle.Danger).setDisabled(!logChannelId),
            new ButtonBuilder().setCustomId('config_remove_notification_channel').setLabel('通知解除').setStyle(ButtonStyle.Danger).setDisabled(!notificationChannelId),
            new ButtonBuilder().setCustomId('config_remove_dashboard').setLabel('掲示板削除').setStyle(ButtonStyle.Danger).setDisabled(!dashboard)
        );

    const components = [row];
    // いずれかの設定がされている場合のみ解除ボタンを表示
    if (logChannelId || managerRoleId || notificationChannelId || dashboard) {
        components.push(removeButtons);
    }

    return { embeds: [settingsEmbed], components: components, flags: MessageFlags.Ephemeral };
}

module.exports = { createConfigPanel };