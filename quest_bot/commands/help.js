// commands/help.js

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('legion-help')
    .setDescription('利用可能なすべてのコマンドの一覧を表示します。'),

  async execute(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('🤖 Bot コマンドヘルプ')
        .setColor(0x00bfff)
        .setDescription('このBotで利用できるコマンドの一覧です。');

      embed.addFields(
        { name: '`/クエスト掲示板設置`', value: 'このチャンネルに新しいクエスト掲示板を設置します。' },
        { name: '`/完了クエスト一覧`', value: '完了（アーカイブ）済みのクエストを一覧表示します。' },
        { name: '`/legion-help`', value: 'このヘルプメッセージを表示します。' }
      );

      embed.addFields({
        name: '​', value: '--- **管理者向けコマンド** ---' }, // ​はゼロ幅スペース
        { name: '`/クエスト設定`', value: 'Botの各種設定をボタン操作で行います。' }
      );

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral, // コマンド実行者のみに見えるようにする
      });
    } catch (error) {
      console.error('ヘルプコマンドの実行中にエラーが発生しました:', error);
      // エラーハンドリングはメインのindex.jsに任せるが、念のためログ出力
    }
  },
};