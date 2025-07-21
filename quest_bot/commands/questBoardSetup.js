// commands/questBoardSetup.js

const { SlashCommandBuilder } = require('discord.js');
const { createQuestEmbed } = require('../utils/embeds');
const { logAction } = require('../utils/logger');
const { createQuestActionRow } = require('../components/questActionButtons');
const questDataManager = require('../utils/questDataManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('クエスト掲示板設置')
    .setDescription('このチャンネルにクエスト掲示板を設置します'),

  async execute(interaction) {
    // 初期状態のクエストデータ（受注ボタンは無効になる）
    const initialQuest = {
      title: '',
      description: '',
      teams: 0,
      people: 0,
      deadline: null,
      guildId: interaction.guildId, // Embedの色取得のためにguildIdを追加
      issuerId: interaction.user.id, // クエスト設置者を発注者として初期設定
      accepted: [],
      isArchived: false,
      isClosed: false,
    };

    const embed = createQuestEmbed(initialQuest);

    // 初期状態のボタンを作成
    const buttons = createQuestActionRow(initialQuest, interaction.user.id); // 設置者のIDを渡す

    // 1. 掲示板メッセージを送信
    const message = await interaction.reply({
      embeds: [embed],
      components: [buttons],
      fetchReply: true, // 送信したメッセージオブジェクトを取得するため
    });

    // 2. 送信したメッセージをクエストとしてDBに登録
    const questData = { ...initialQuest, channelId: interaction.channelId };
    questDataManager.createQuest(interaction.guildId, message.id, questData);
    logAction(interaction, 'クエスト掲示板を設置', `チャンネル: <#${interaction.channelId}>`);
  },
};
