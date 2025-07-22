// commands/questBoardSetup.js

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createQuestEmbed } = require('../utils/embeds');
const { logAction } = require('../utils/logger');
const { createQuestActionRow } = require('../components/questActionButtons');
const questDataManager = require('../utils/questDataManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('クエスト掲示板設置')
    .setDescription('このチャンネルにクエスト掲示板を設置し、あなたが受注中のクエスト一覧を通知します。'),

  async execute(interaction) {
    // 1. 掲示板メッセージを送信
    const initialQuest = {
      title: '',
      description: '',
      teams: 0,
      people: 0,
      deadline: null,
      guildId: interaction.guildId,
      issuerId: interaction.user.id,
      accepted: [],
      isArchived: false,
      isClosed: false,
    };

    const embed = await createQuestEmbed(initialQuest);

    // 初期状態のボタンを作成
    const buttons = createQuestActionRow(initialQuest, interaction.user.id);

    const message = await interaction.reply({
      embeds: [embed],
      components: [buttons],
      fetchReply: true,
    });

    // 2. 送信したメッセージをクエストとしてDBに登録
    const questData = { ...initialQuest, channelId: interaction.channelId };
    await questDataManager.createQuest(interaction.guildId, message.id, questData, interaction.user);
    await logAction(interaction, {
      title: '✅ クエスト掲示板 設置',
      color: '#2ecc71',
      details: {
        '掲示板メッセージID': message.id,
        '設置チャンネル': `<#${interaction.channelId}>`,
      },
    });

    // 3. 受注中クエスト一覧を取得して通知 (ephemeral)
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    const allQuests = await questDataManager.getAllQuests(guildId);
    const myAcceptedQuests = [];

    for (const questId in allQuests) {
      const quest = allQuests[questId];
      if (quest.isArchived || !quest.accepted) {
        continue;
      }
      const myAcceptances = quest.accepted.filter(a => a.userId === userId);
      if (myAcceptances.length > 0) {
        myAcceptedQuests.push({
          questInfo: quest,
          acceptances: myAcceptances,
        });
      }
    }

    if (myAcceptedQuests.length > 0) {
      const myQuestsEmbed = new EmbedBuilder()
        .setTitle('📋 あなたが受注中のクエスト')
        .setColor(0x57f287) // Green
        .setDescription('掲示板設置と同時に、あなたが現在参加しているクエストをお知らせします。');

      myAcceptedQuests.forEach(({ questInfo, acceptances }) => {
        const questUrl = `https://discord.com/channels/${guildId}/${questInfo.channelId}/${questInfo.messageId}`;
        const title = questInfo.title || '無題のクエスト';
        const acceptanceDetails = acceptances.map(a => `・${a.teams}組 / ${a.people}人`).join('\n');
        myQuestsEmbed.addFields({ name: `**${title}**`, value: `クエストへ移動\n**あなたの受注内容:**\n${acceptanceDetails}` });
      });

      await interaction.followUp({
        embeds: [myQuestsEmbed],
        ephemeral: true,
      });
    }
  },
};
