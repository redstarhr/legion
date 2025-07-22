// interactions/modals/questAcceptHandler.js

const { EmbedBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { updateAllQuestMessages } = require('../../utils/messageUpdater');
const { logAction } = require('../../utils/logger');

module.exports = {
  customId: 'quest_accept_submit_',

  async handle(interaction) {
    await interaction.deferUpdate();

    const originalMessageId = interaction.customId.split('_')[3];
    const guildId = interaction.guildId;

    const teams = interaction.fields.getTextInputValue('accept_teams_input');
    const people = interaction.fields.getTextInputValue('accept_people_input');
    const comment = interaction.fields.getTextInputValue('accept_comment_input');

    const teamsNum = parseInt(teams, 10);
    const peopleNum = parseInt(people, 10);

    if (isNaN(teamsNum) || isNaN(peopleNum) || teamsNum <= 0 || peopleNum <= 0) {
      return interaction.followUp({ content: '⚠️ 正の数値を入力してください。', ephemeral: true });
    }

    // 1. Attempt to update data
    const result = await questDataManager.acceptQuest(guildId, originalMessageId, {
      teams: teamsNum,
      people: peopleNum,
      user: interaction.user.username,
      userId: interaction.user.id,
      channelName: interaction.channel.name,
      timestamp: Date.now(),
      comment: comment || null,
    });

    // Handle errors (e.g., recruitment full)
    if (!result) {
      return interaction.followUp({ content: '⚠️ クエストデータの更新に失敗しました。', ephemeral: true });
    }
    if (result.error) {
      return interaction.followUp({ content: `⚠️ ${result.error}`, ephemeral: true });
    }

    const { quest } = result;

    // 2. Update all related messages using the common function
    await updateAllQuestMessages(interaction.client, quest, interaction.user.id);

    // Log the action
    await logAction(interaction, 'クエストを受注', `クエストID: ${originalMessageId}\n${teamsNum}組 / ${peopleNum}人`);

    // Send notification to the configured channel
    const notificationChannelId = await questDataManager.getNotificationChannel(guildId);
    if (notificationChannelId) {
      try {
        const notificationChannel = await interaction.client.channels.fetch(notificationChannelId);
        const notificationEmbed = new EmbedBuilder()
          .setColor(0x57f287) // Green
          .setTitle('✅ クエスト受注通知')
          .setDescription(`クエスト「${quest.title || '無題のクエスト'}」に新しい受注がありました。`)
          .addFields(
            { name: '受注者', value: `${interaction.user.tag}` },
            { name: '受注内容', value: `${teamsNum}組 / ${peopleNum}人` },
            { name: '受注があったチャンネル', value: `\`${interaction.channel.name}\`` }
          )
          .setTimestamp();
        if (comment) {
          notificationEmbed.addFields({ name: 'コメント', value: comment });
        }
        if (notificationChannel.isTextBased()) {
          await notificationChannel.send({ embeds: [notificationEmbed] });
        }
      } catch (error) {
        console.error(`[${guildId}] クエスト通知チャンネルへの送信に失敗しました (Channel ID: ${notificationChannelId}):`, error);
        await logAction(interaction, '通知失敗', `チャンネル <#${notificationChannelId}> への通知送信に失敗しました。`, '#ff0000');
      }
    }

    await interaction.followUp({ content: '✅ クエストを受注しました！', ephemeral: true });
  },
};