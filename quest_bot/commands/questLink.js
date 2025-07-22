// commands/questLink.js

const { SlashCommandBuilder, ChannelType } = require('discord.js');
const questDataManager = require('../utils/questDataManager');
const { createQuestEmbed } = require('../utils/embeds');
const { createQuestActionRow } = require('../components/questActionButtons');
const { logAction } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('クエスト連携')
    .setDescription('既存のクエスト掲示板を別のチャンネルに連携（ミラーリング）します。')
    .addStringOption(option =>
      option.setName('対象メッセージid')
        .setDescription('連携したいクエスト掲示板のメッセージID')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('連携先チャンネル')
        .setDescription('掲示板を連携する先のチャンネル')
        .addChannelTypes(ChannelType.GuildText) // テキストチャンネルのみ選択可能
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const sourceMessageId = interaction.options.getString('対象メッセージid');
    const targetChannel = interaction.options.getChannel('連携先チャンネル');
    const guildId = interaction.guildId;

    // 1. 連携元のクエストデータを取得
    const quest = await questDataManager.getQuest(guildId, sourceMessageId);

    if (!quest) {
      return interaction.followUp({ content: '⚠️ 指定されたIDのクエスト掲示板が見つかりません。メッセージIDが正しいか確認してください。' });
    }

    // 2. 連携先にメッセージを送信
    try {
      const embed = await createQuestEmbed(quest);
      const buttons = createQuestActionRow(quest, interaction.user.id);

      const linkedMessage = await targetChannel.send({
        embeds: [embed],
        components: [buttons],
      });

      // 3. 連携情報をDBに保存
      const newLink = {
        channelId: linkedMessage.channelId,
        messageId: linkedMessage.id,
      };

      const updatedLinkedMessages = [...quest.linkedMessages, newLink];

      await questDataManager.updateQuest(guildId, sourceMessageId, {
        linkedMessages: updatedLinkedMessages,
      }, interaction.user);

      await interaction.followUp({ content: `✅ クエスト掲示板を <#${targetChannel.id}> に連携しました。` });
      await logAction(interaction, {
        title: '🔗 クエスト連携',
        color: '#3498db',
        details: {
          '元クエストID': sourceMessageId,
          '連携先チャンネル': `<#${targetChannel.id}>`,
          '連携後メッセージID': linkedMessage.id,
        },
      });
    } catch (error) {
      console.error('連携メッセージの送信に失敗しました:', error);
      await interaction.followUp({ content: '⚠️ 連携メッセージの送信に失敗しました。Botに必要な権限（メッセージの送信・閲覧）があるか確認してください。' });
    }
  },
};