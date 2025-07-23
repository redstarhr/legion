const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const questDataManager = require('../utils/questDataManager');

async function createConfigPanel(interaction) {
    const guildId = interaction.guildId;

    // Fetch current settings from the data manager
    const logChannelId = await questDataManager.getLogChannel(guildId);
    const managerRoleId = await questDataManager.getQuestManagerRole(guildId);
    const notificationChannelId = await questDataManager.getNotificationChannel(guildId);
    const embedColor = await questDataManager.getEmbedColor(guildId) || '#5865F2';

    const settingsEmbed = new EmbedBuilder()
        .setTitle('⚙️ クエストBot 設定パネル')
        .setColor(embedColor)
        .setDescription('現在のサーバー設定です。\n下のメニューから変更したい項目を選択してください。')
        .addFields(
            { name: 'ログチャンネル', value: logChannelId ? `<#${logChannelId}>` : '未設定', inline: true },
            { name: '管理者ロール', value: managerRoleId ? `<@&${managerRoleId}>` : '未設定', inline: true },
            { name: '通知チャンネル', value: notificationChannelId ? `<#${notificationChannelId}>` : '未設定', inline: true }
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
                        label: '管理者ロール設定',
                        description: 'Botの管理権限を持つロールを設定します。',
                        value: 'set_manager_role',
                    },
                    {
                        label: '通知チャンネル設定',
                        description: 'クエストの受注・取消等の通知を送信するチャンネルを設定します。',
                        value: 'set_notification_channel',
                    },
                ])
        );

    return { embeds: [settingsEmbed], components: [row], ephemeral: true };
}

module.exports = { createConfigPanel };