// commands/questBoardSetup.js

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const questDataManager = require('../utils/questDataManager');
const { updateDashboard } = require('../utils/dashboardManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('クエスト掲示板設置')
    .setDescription('このチャンネルにクエストダッシュボードを設置します。(管理者のみ)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const existingDashboard = await questDataManager.getDashboard(interaction.guildId);
    if (existingDashboard) {
        return interaction.followUp({ content: '既にこのサーバーにはクエストダッシュボードが設置されています。' });
    }

    try {
        const message = await interaction.channel.send({ content: 'ダッシュボードを生成中...' });
        await questDataManager.setDashboard(interaction.guildId, message.id, interaction.channelId);

        // 初回更新
        await updateDashboard(interaction.client, interaction.guildId);

        await interaction.followUp({ content: '✅ クエストダッシュボードをこのチャンネルに設置しました。' });
    } catch (error) {
        console.error('ダッシュボードの設置に失敗しました:', error);
        await interaction.followUp({ content: '❌ ダッシュボードの設置に失敗しました。Botに必要な権限（メッセージの送信・編集）があるか確認してください。' });
    }
  },
};
