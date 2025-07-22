// commands/questUnlink.js

const { SlashCommandBuilder } = require('discord.js');
const questDataManager = require('../utils/questDataManager');
const { logAction } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('クエスト連携解除')
    .setDescription('連携されているクエスト掲示板を解除し、メッセージを削除します。')
    .addStringOption(option =>
      option.setName('対象メッセージid')
        .setDescription('連携を解除したい掲示板のメッセージID')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const targetMessageId = interaction.options.getString('対象メッセージid');
    const guildId = interaction.guildId;

    // 1. 連携先のIDから元のクエストを探す
    const result = await questDataManager.findQuestByLinkedMessageId(guildId, targetMessageId);

    if (!result) {
      return interaction.followUp({ content: '⚠️ 指定されたIDを持つ連携掲示板が見つかりません。IDが正しいか確認してください。' });
    }

    const { originalQuest, linkedMessageInfo } = result;

    // 2. 連携リストから対象を削除
    const updatedLinks = originalQuest.linkedMessages.filter(
      link => link.messageId !== targetMessageId
    );

    // 3. データベースを更新
    const updateSuccess = await questDataManager.updateQuest(guildId, originalQuest.messageId, {
      linkedMessages: updatedLinks,
    }, interaction.user);

    if (!updateSuccess) {
      return interaction.followUp({ content: '⚠️ データベースの更新に失敗しました。' });
    }

    await logAction(interaction, {
      title: '🗑️ クエスト連携 解除',
      color: '#e74c3c',
      details: {
        '元クエストID': originalQuest.messageId,
        '解除対象メッセージID': targetMessageId,
        '解除対象チャンネル': `<#${linkedMessageInfo.channelId}>`,
      },
    });

    // 4. Discord上のメッセージを削除
    try {
      const channel = await interaction.client.channels.fetch(linkedMessageInfo.channelId);
      await channel.messages.delete(targetMessageId);
      await interaction.followUp({ content: `✅ <#${linkedMessageInfo.channelId}> の掲示板の連携を解除しました。` });
    } catch (error) {
      console.error('連携解除メッセージの削除に失敗:', error);
      await interaction.followUp({ content: '⚠️ データベースからの連携解除には成功しましたが、Discord上のメッセージ削除に失敗しました。お手数ですが手動で削除してください。' });
    }
  },
};