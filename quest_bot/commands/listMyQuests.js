// commands/listMyQuests.js

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const questDataManager = require('../utils/questDataManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('受注中クエスト一覧')
    .setDescription('あなたが現在受注しているクエストの一覧を表示します。'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    const allQuests = await questDataManager.getAllQuests(guildId);
    const myAcceptedQuests = [];

    // 全てのクエストをスキャンして、自分が受注しているものを探す
    for (const questId in allQuests) {
      const quest = allQuests[questId];
      // アーカイブ済みのクエストは除外
      if (quest.isArchived) {
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

    if (myAcceptedQuests.length === 0) {
      return interaction.followUp({ content: '現在受注しているクエストはありません。' });
    }

    const embed = new EmbedBuilder()
      .setTitle('📋 あなたが受注中のクエスト')
      .setColor(0x57f287) // Green
      .setDescription('現在あなたが参加しているクエストの一覧です。');

    myAcceptedQuests.forEach(({ questInfo, acceptances }) => {
      const questUrl = `https://discord.com/channels/${guildId}/${questInfo.channelId}/${questInfo.messageId}`;
      const title = questInfo.title || '無題のクエスト';
      const acceptanceDetails = acceptances.map(a => `・${a.teams}組 / ${a.people}人`).join('\n');

      embed.addFields({ name: `**${title}**`, value: `クエストへ移動\n**あなたの受注内容:**\n${acceptanceDetails}` });
    });

    await interaction.followUp({ embeds: [embed], ephemeral: true });
  },
};