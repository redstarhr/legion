const questDataManager = require('../../utils/questDataManager');
const { logAction } = require('../../utils/logger');
const { updateDashboard } = require('../../utils/dashboardManager');
const { RESTJSONErrorCodes } = require('discord.js');

async function handleChannelSelect(interaction) {
    await interaction.deferUpdate();
    const channelId = interaction.values[0];
    const channel = await interaction.guild.channels.fetch(channelId);

    if (!channel) {
        return interaction.editReply({ content: '⚠️ 選択されたチャンネルが見つかりませんでした。', components: [] });
    }

    await questDataManager.setLogChannel(interaction.guildId, channelId);

    let testMessageSuccess = false;
    try {
        await channel.send({ content: '✅ このチャンネルがログ出力先に設定されました。' });
        testMessageSuccess = true;
    } catch (error) {
        console.error(`ログチャンネル (${channel.id}) へのテストメッセージ送信に失敗:`, error);
    }

    const replyMessage = `✅ ログ出力チャンネルを <#${channel.id}> に設定しました。`;
    let finalMessage = replyMessage;
    if (!testMessageSuccess) {
        finalMessage += '\n⚠️ **警告:** このチャンネルへのメッセージ送信に失敗しました。Botに「メッセージを送信」と「埋め込みリンク」の権限があるか確認してください。';
    }

    await logAction(interaction, {
        title: '⚙️ ログチャンネル設定',
        description: replyMessage,
        color: '#95a5a6',
        details: {
            '設定チャンネル': `<#${channel.id}>`,
        },
    });

    await interaction.editReply({
        content: finalMessage,
        components: [],
    });
}

async function handleRoleSelect(interaction) {
    await interaction.deferUpdate();
    const roleId = interaction.values[0];
    const role = await interaction.guild.roles.fetch(roleId);

    if (!role) {
        return interaction.editReply({ content: '⚠️ 選択されたロールが見つかりませんでした。', components: [] });
    }

    await questDataManager.setQuestManagerRole(interaction.guildId, roleId);

    const replyMessage = `✅ クエスト管理者ロールを **${role.name}** に設定しました。`;

    await logAction(interaction, {
        title: '⚙️ 管理者ロール設定',
        description: replyMessage,
        color: '#95a5a6',
        details: {
            '設定ロール': `${role.name} (${role.id})`,
        },
    });

    await interaction.editReply({
        content: replyMessage,
        components: [],
    });
}

async function handleNotificationChannelSelect(interaction) {
    await interaction.deferUpdate();
    const channelId = interaction.values[0];
    const channel = await interaction.guild.channels.fetch(channelId);

    if (!channel) {
        return interaction.editReply({ content: '⚠️ 選択されたチャンネルが見つかりませんでした。', components: [] });
    }

    await questDataManager.setNotificationChannel(interaction.guildId, channelId);

    let testMessageSuccess = false;
    try {
        await channel.send({ content: '✅ このチャンネルがクエストの受注・取消通知の送信先に設定されました。' });
        testMessageSuccess = true;
    } catch (error) {
        console.error(`通知チャンネル (${channel.id}) へのテストメッセージ送信に失敗:`, error);
    }

    const replyMessage = `✅ 通知チャンネルを <#${channel.id}> に設定しました。`;
    let finalMessage = replyMessage;
    if (!testMessageSuccess) {
        finalMessage += '\n⚠️ **警告:** このチャンネルへのメッセージ送信に失敗しました。Botに「メッセージを送信」と「埋め込みリンク」の権限があるか確認してください。';
    }

    await logAction(interaction, {
        title: '⚙️ 通知チャンネル設定',
        description: replyMessage,
        color: '#95a5a6',
        details: {
            '設定チャンネル': `<#${channel.id}>`,
        },
    });

    await interaction.editReply({
        content: finalMessage,
        components: [],
    });
}

async function handleDashboardChannelSelect(interaction) {
    await interaction.deferUpdate();
    const guildId = interaction.guildId;
    const newChannelId = interaction.values[0];

    // 1. 既存のダッシュボード情報を取得
    const oldDashboard = await questDataManager.getDashboard(guildId);

    // 2. 既存のダッシュボードメッセージがあれば削除
    if (oldDashboard && oldDashboard.channelId) {
        try {
            const oldChannel = await interaction.client.channels.fetch(oldDashboard.channelId);
            await oldChannel.messages.delete(oldDashboard.messageId);
        } catch (error) {
            if (error.code !== RESTJSONErrorCodes.UnknownMessage && error.code !== RESTJSONErrorCodes.UnknownChannel) {
                console.error(`[DashboardSetup] 古いダッシュボードメッセージの削除に失敗:`, error);
                // 削除に失敗しても処理は続行する
            }
        }
    }

    // 3. 新しいチャンネルにダッシュボードを設置
    const newChannel = await interaction.guild.channels.fetch(newChannelId);
    if (!newChannel || !newChannel.isTextBased()) {
        return interaction.editReply({ content: '⚠️ 選択されたチャンネルが見つからないか、テキストチャンネルではありません。', components: [] });
    }

    // プレースホルダーメッセージを送信
    const placeholderMessage = await newChannel.send({ content: '📡 新しいクエスト掲示板を生成中...' });

    // 4. 新しいダッシュボード情報を保存
    await questDataManager.setDashboard(guildId, placeholderMessage.id, newChannelId);

    // 5. ダッシュボードを内容で更新
    await updateDashboard(interaction.client, guildId);

    const replyMessage = `✅ クエスト掲示板を <#${newChannelId}> に設置しました。`;

    await logAction(interaction, {
        title: '⚙️ 掲示板チャンネル設定',
        description: replyMessage,
        color: '#95a5a6',
    });

    await interaction.editReply({ content: replyMessage, components: [] });
}

module.exports = {
    customId: 'setting_select_', // prefix
    async handle(interaction) {
        try {
            switch (interaction.customId) {
                case 'setting_select_log_channel':
                    return await handleChannelSelect(interaction);
                case 'setting_select_manager_role':
                    return await handleRoleSelect(interaction);
                case 'setting_select_notification_channel':
                    return await handleNotificationChannelSelect(interaction);
                case 'setting_select_dashboard_channel':
                    return await handleDashboardChannelSelect(interaction);
                default:
                    return; // Should not happen
            }
        } catch (error) {
            console.error('設定項目の選択処理中にエラーが発生しました:', error);
            await interaction.editReply({ content: 'エラーが発生したため、設定を更新できませんでした。', components: [] }).catch(console.error);
        }
    }
};