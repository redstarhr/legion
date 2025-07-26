const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const configDataManager = require('../../manager/configDataManager');

async function createConfigPanel(interaction) {
    const config = await configDataManager.getLegionConfig(interaction.guildId);

    const dashboards = config.dashboard ?? []; 

    const logChannelId = config.logChannelId;
    const notificationChannelId = config.notificationChannelId;
    const acceptanceRoleIds = config.questAcceptanceRoleIds || [];  // 受注ロール

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
                .setCustomId('setting_set_acceptance_roles')  // 受注ロール設定のカスタムIDに変更
                .setLabel('クエスト受注ロール設定')
                .setStyle(ButtonStyle.Primary)
        );

    let dashboardDesc = '未設定';
    if (Array.isArray(dashboards) && dashboards.length > 0) {
        dashboardDesc = dashboards
            .map(d => `<#${d.channelId}>`)
            .join('\n');
    }

    let description = '各種設定を行うボタンを選択してください。\n\n**現在の設定:**\n';
    description += `> **ログ:** ${logChannelId ? `<#${logChannelId}>` : '未設定'}\n`;
    description += `> **通知:** ${notificationChannelId ? `<#${notificationChannelId}>` : '未設定'}\n`;
    description += `> **受注ロール:** ${acceptanceRoleIds.length > 0 ? acceptanceRoleIds.map(id => `<@&${id}>`).join(', ') : '未設定'}\n`;
    description += `> **クエストダッシュボード:**\n${dashboardDesc}\n`;

    return {
        content: description,
        components: [row1, row2],
        flags: MessageFlags.Ephemeral,
    };
}

module.exports = { createConfigPanel };
