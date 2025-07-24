const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const configDataManager = require('../../configDataManager');

async function createConfigPanel(interaction) {
    const config = await configDataManager.getLegionConfig(interaction.guildId);

    // Get current settings
    const logChannelId = config.logChannelId;
    const notificationChannelId = config.notificationChannelId;
    const creatorRoleIds = config.questCreatorRoleIds || [];

    // Create buttons
    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('setting_set_log_channel')
                .setLabel('ログチャンネル設定')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('setting_set_notification_channel')
                .setLabel('通知チャンネル設定')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('setting_set_embed_color')
                .setLabel('埋め込みカラー設定')
                .setStyle(ButtonStyle.Secondary),
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('setting_set_creator_roles')
                .setLabel('クエスト作成者ロール設定')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('setting_set_button_order')
                .setLabel('ボタン順序設定')
                .setStyle(ButtonStyle.Secondary)
        );

    let description = '各種設定を行うボタンを選択してください。\n\n**現在の設定:**\n';
    description += `> **ログ:** ${logChannelId ? `<#${logChannelId}>` : '未設定'}\n`;
    description += `> **通知:** ${notificationChannelId ? `<#${notificationChannelId}>` : '未設定'}\n`;
    description += `> **作成者ロール:** ${creatorRoleIds.length > 0 ? creatorRoleIds.map(id => `<@&${id}>`).join(', ') : '未設定'}`;

    return {
        content: description,
        components: [row1, row2],
        flags: MessageFlags.Ephemeral,
    };
}

module.exports = { createConfigPanel };