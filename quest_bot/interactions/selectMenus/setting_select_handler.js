const questDataManager = require('../../utils/questDataManager');
const { logAction } = require('../../utils/logger');

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

    const replyMessage = `✅ 通知チャンネルを <#${channel.id}> に設定しました。`;

    await logAction(interaction, {
        title: '⚙️ 通知チャンネル設定',
        description: replyMessage,
        color: '#95a5a6',
        details: {
            '設定チャンネル': `<#${channel.id}>`,
        },
    });

    await interaction.editReply({
        content: replyMessage,
        components: [],
    });
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
                default:
                    return; // Should not happen
            }
        } catch (error) {
            console.error('設定項目の選択処理中にエラーが発生しました:', error);
            await interaction.editReply({ content: 'エラーが発生したため、設定を更新できませんでした。', components: [] }).catch(console.error);
        }
    }
};