const configDataManager = require('../../../configDataManager');
const { logAction } = require('../../utils/logger');
const { updateDashboard } = require('../../utils/dashboardManager');
const { RESTJSONErrorCodes, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { createConfigPanel } = require('../../components/configPanel');

const colorOptions = [
    { label: 'デフォルト (水色)', value: '#00bfff' }, { label: '青', value: '#3498db' },
    { label: '緑', value: '#2ecc71' }, { label: '赤', value: '#e74c3c' },
    { label: '紫', value: '#9b59b6' }, { label: '黄色', value: '#f1c40f' },
    { label: 'オレンジ', value: '#e67e22' }, { label: 'ピンク', value: '#e91e63' },
    { label: '白', value: '#ffffff' }, { label: '黒', value: '#2c2f33' },
];

const allButtonOptions = [
    { label: '受注する', value: 'accept' }, { label: '受注取消', value: 'cancel' },
    { label: '編集', value: 'edit' }, { label: '参加者に連絡', value: 'dm' },
];
const buttonNameMap = { accept: '受注', cancel: '受注取消', edit: '編集', dm: '参加者に連絡' };

async function handleChannelSelect(interaction) {
    await interaction.deferUpdate();
    const channelId = interaction.values[0];
    const channel = await interaction.guild.channels.fetch(channelId);

    if (!channel) {
        return interaction.editReply({ content: '⚠️ 選択されたチャンネルが見つかりませんでした。', components: [] });
    }

    await configDataManager.setLogChannel(interaction.guildId, channelId);

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

    await configDataManager.setQuestAdminRole(interaction.guildId, roleId);

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

    await configDataManager.setNotificationChannel(interaction.guildId, channelId);

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
    const oldDashboard = await configDataManager.getDashboard(guildId);

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
    await configDataManager.setDashboard(guildId, placeholderMessage.id, newChannelId);

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

async function handleEmbedColorSelect(interaction) {
    await interaction.deferUpdate();
    const selectedColor = interaction.values[0];
    const selectedOption = colorOptions.find(opt => opt.value === selectedColor) || { label: 'カスタム', value: selectedColor };

    await configDataManager.setEmbedColor(interaction.guildId, selectedColor);

    const replyMessage = `✅ Embedの色を **${selectedOption.label} (${selectedColor})** に設定しました。`;
    await logAction(interaction, { title: '⚙️ Embedカラー設定', description: replyMessage, color: '#95a5a6' });

    const newView = await createConfigPanel(interaction);
    await interaction.editReply(newView);
}

async function handleButtonOrderSelect(interaction) {
    await interaction.deferUpdate();
    const parts = interaction.customId.split('_');
    const currentStep = parseInt(parts[4], 10);
    const selectedOrder = parts.length > 5 ? parts.slice(5) : [];
    const newSelection = interaction.values[0];
    selectedOrder.push(newSelection);

    const nextStep = currentStep + 1;

    if (nextStep <= 4) {
        const remainingOptions = allButtonOptions.filter(opt => !selectedOrder.includes(opt.value));
        const newCustomId = `setting_select_button_order_${nextStep}_${selectedOrder.join('_')}`;
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(newCustomId)
            .setPlaceholder(`${nextStep}番目に表示するボタンを選択してください`)
            .addOptions(remainingOptions);
        const row = new ActionRowBuilder().addComponents(selectMenu);
        const friendlyOrder = selectedOrder.map(key => `\`${buttonNameMap[key]}\``).join(' > ');
        await interaction.editReply({
            content: `現在の選択: ${friendlyOrder}\n\n**${nextStep}番目**に表示するボタンを選択してください:`,
            components: [row],
        });
    } else {
        await configDataManager.setButtonOrder(interaction.guildId, selectedOrder);
        await logAction(interaction, {
            title: '⚙️ ボタン順設定',
            description: `✅ ボタンの表示順を **${selectedOrder.map(key => `\`${buttonNameMap[key]}\``).join(' > ')}** に設定しました。`,
            color: '#95a5a6',
        });
        const newView = await createConfigPanel(interaction);
        await interaction.editReply(newView);
    }
}

module.exports = {
    customId: 'setting_select_', // prefix
    async handle(interaction) {
        try {
            const customId = interaction.customId;

            if (customId === 'setting_select_log_channel') {
                return await handleChannelSelect(interaction);
            }
            if (customId === 'setting_select_manager_role') {
                return await handleRoleSelect(interaction);
            }
            if (customId === 'setting_select_notification_channel') {
                return await handleNotificationChannelSelect(interaction);
            }
            if (customId === 'setting_select_dashboard_channel') {
                return await handleDashboardChannelSelect(interaction);
            }
            if (customId === 'setting_select_embed_color') {
                return await handleEmbedColorSelect(interaction);
            }
            if (customId.startsWith('setting_select_button_order_')) {
                return await handleButtonOrderSelect(interaction);
            }
        } catch (error) {
            console.error('設定項目の選択処理中にエラーが発生しました:', error);
            await interaction.editReply({ content: 'エラーが発生したため、設定を更新できませんでした。', components: [] }).catch(console.error);
        }
    }
};