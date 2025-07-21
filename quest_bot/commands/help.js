// commands/help.js

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('利用可能なすべてのコマンドの一覧を表示します。'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Bot コマンドヘルプ')
      .setColor(0x00bfff)
      .setDescription('このBotで利用できるコマンドの一覧です。');

    embed.addFields(
      { name: '`/クエスト掲示板設置`', value: 'このチャンネルに新しいクエスト掲示板を設置します。' },
      { name: '`/クエスト連携`', value: '既存のクエスト掲示板を別のチャンネルに連携（ミラーリング）します。' },
      { name: '`/クエスト連携解除`', value: '連携されているクエスト掲示板を解除します。' },
      { name: '`/完了クエスト一覧`', value: '完了（アーカイブ）済みのクエストを一覧表示します。' },
      { name: '`/受注中クエスト一覧`', value: 'あなたが現在受注しているアクティブなクエストを一覧表示します。' },
      { name: '`/help`', value: 'このヘルプメッセージを表示します。' }
    );

    embed.addFields({
      name: '管理者向けコマンド',
      value: 'サーバーの管理者、または設定されたロールを持つユーザーのみが実行できます。',
    });

    embed.addFields(
      { name: '`/config [サブコマンド]`', value: 'Botの各種設定を行います。\n- `ロール設定`: クエスト管理者ロール\n- `ログ設定`: 操作ログチャンネル\n- `通知設定`: 受注/取消通知チャンネル\n- `色設定`: 掲示板のEmbedカラー' }
    );

    await interaction.reply({
      embeds: [embed],
      ephemeral: true, // コマンド実行者のみに見えるようにする
    });
  },
};