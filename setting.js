const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const questDataManager = require('../utils/questDataManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setting')
        .setDescription('クエストボットの各種設定を行います。')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild) // サーバー管理者のみ
        .setDMPermission(false),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const guildId = interaction.guildId;

        // 現在の設定値を取得
        const logChannelId = await questDataManager.getLogChannel(guildId);
        const managerRoleId = await questDataManager.getQuestManagerRole(guildId);
        const embedColor = await questDataManager.getEmbedColor(guildId);

        // 現在の設定値を表示するEmbedを作成
        const settingsEmbed = new EmbedBuilder()
            .setTitle('⚙️ クエストボット設定')
            .setColor(embedColor)
            .setDescription('現在のサーバー設定です。\n下のメニューから変更したい項目を選択してください。')
            .addFields(
                { name: 'ログチャンネル', value: logChannelId ? `<#${logChannelId}>` : '未設定', inline: true },
                { name: '管理者ロール', value: managerRoleId ? `<@&${managerRoleId}>` : '未設定', inline: true },
                { name: '埋め込みカラー', value: `\`${embedColor}\``, inline: true }
            )
            .setTimestamp();

        // 設定項目を選択するセレクトメニュー
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('setting_menu')
                    .setPlaceholder('設定項目を選択...')
                    .addOptions([
                        {
                            label: 'ログチャンネル設定',
                            description: 'クエストの完了や失敗などのログを送信するチャンネルを設定します。',
                            value: 'set_log_channel',
                        },
                        {
                            label: '管理者ロール設定',
                            description: 'クエストの管理権限を持つロールを設定します。',
                            value: 'set_manager_role',
                        },
                        // 他の設定項目もここに追加可能
                    ])
            );

        await interaction.editReply({ embeds: [settingsEmbed], components: [row] });
    },
};