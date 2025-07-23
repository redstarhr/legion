// commands/questBoardSetup.js

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('クエスト掲示板設置')
    .setDescription('クエスト掲示板を設置するチャンネルを選択します。(管理者のみ)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const row = new ActionRowBuilder()
        .addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId('setting_select_dashboard_channel') // 既存の設定ハンドラを再利用
            .setPlaceholder('掲示板を設置/移動するチャンネルを選択')
            .addChannelTypes([ChannelType.GuildText])
            .setMinValues(1)
            .setMaxValues(1)
        );

      await interaction.reply({
        content: 'クエスト掲示板を設置するチャンネルを選択してください。\n既に掲示板がある場合は、新しい場所に移動します。',
        components: [row],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
        console.error('❌ ダッシュボードの設置に失敗しました:', error);
        const errorMessage = '❌ ダッシュボードの設置に失敗しました。Botに必要な権限（メッセージの送信・編集）があるか確認してください。';

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: errorMessage }).catch(console.error);
        } else {
            await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral }).catch(console.error);
        }
    }
  },
};
