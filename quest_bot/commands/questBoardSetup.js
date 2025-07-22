// commands/questBoardSetup.js

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const questDataManager = require('../utils/questDataManager');
const { updateDashboard } = require('../utils/dashboardManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('クエスト掲示板設置')
    .setDescription('このチャンネルにクエストダッシュボードを設置します。(管理者のみ)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

      const existingDashboard = await questDataManager.getDashboard(interaction.guildId);
      if (existingDashboard) {
          return interaction.editReply({ content: '既にこのサーバーにはクエストダッシュボードが設置されています。' });
      }

        const message = await interaction.channel.send({ content: 'ダッシュボードを生成中...' });
        await questDataManager.setDashboard(interaction.guildId, message.id, interaction.channelId);

        // 初回更新
        await updateDashboard(interaction.client, interaction.guildId);

        await interaction.editReply({ content: '✅ クエストダッシュボードをこのチャンネルに設置しました。' });
    } catch (error) {
        console.error('ダッシュボードの設置に失敗しました:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ content: '❌ ダッシュボードの設置に失敗しました。Botに必要な権限（メッセージの送信・編集）があるか確認してください。' }).catch(console.error);
        } else {
            await interaction.reply({ content: '❌ ダッシュボードの設置に失敗しました。Botに必要な権限（メッセージの送信・編集）があるか確認してください。', flags: [MessageFlags.Ephemeral] }).catch(console.error);
        }
    }
  },
};
