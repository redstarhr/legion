// quest_bot/interactions/modals/questAcceptSubmit.js
const { EmbedBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { updateAllQuestMessages } = require('../../utils/messageUpdater');
const { logAction } = require('../../utils/logger');

module.exports = {
  customId: 'quest_accept_submit',
  async handle(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const questId = interaction.customId.split('_')[3];
      const guildId = interaction.guildId;

      // 1. Get data from modal
      const teamsStr = interaction.fields.getTextInputValue('accept_teams');
      const peopleStr = interaction.fields.getTextInputValue('accept_people');
      const comment = interaction.fields.getTextInputValue('accept_comment');

      // 2. Validate input
      const teamsNum = parseInt(teamsStr, 10);
      const peopleNum = parseInt(peopleStr, 10);

      if (isNaN(teamsNum) || isNaN(peopleNum) || teamsNum <= 0 || peopleNum <= 0) {
        return interaction.followUp({ content: '⚠️ 組数と人数には1以上の半角数字を入力してください。', ephemeral: true });
      }

      // 3. Re-fetch quest data to prevent race conditions
      const quest = await questDataManager.getQuest(guildId, questId);
      if (!quest || quest.isClosed || quest.isArchived) {
        return interaction.followUp({ content: '⚠️ このクエストは現在募集を締め切っているか、見つかりませんでした。', ephemeral: true });
      }

      // レースコンディション対策で、ここでも重複受注をチェック
      const hasAlreadyAccepted = quest.accepted?.some(a => a.userId === interaction.user.id);
      if (hasAlreadyAccepted) {
          return interaction.followUp({ content: '⚠️ あなたは既にこのクエストを受注済みです。', ephemeral: true });
      }

      // 4. Check for available slots
      const currentAcceptedTeams = quest.accepted?.reduce((sum, a) => sum + a.teams, 0) || 0;
      const currentAcceptedPeople = quest.accepted?.reduce((sum, a) => sum + a.people, 0) || 0;
      const remainingTeams = quest.teams - currentAcceptedTeams;
      const remainingPeople = quest.people - currentAcceptedPeople;

      if (teamsNum > remainingTeams || peopleNum > remainingPeople) {
        return interaction.followUp({ content: `⚠️ 募集枠を超えています。残り: ${remainingTeams}組 / ${remainingPeople}人`, ephemeral: true });
      }

      // 5. Prepare update data
      const newAcceptance = {
        userId: interaction.user.id,
        user: interaction.user.tag,
        channelName: interaction.channel.name,
        teams: teamsNum,
        people: peopleNum,
        comment: comment || null,
        timestamp: Date.now(),
      };

      const updatedAccepted = [...(quest.accepted || []), newAcceptance];

      // Check if the quest is now full
      const newTotalTeams = currentAcceptedTeams + teamsNum;
      const newTotalPeople = currentAcceptedPeople + peopleNum;
      const isNowFull = newTotalTeams >= quest.teams && newTotalPeople >= quest.people;

      const updates = {
        accepted: updatedAccepted,
        isClosed: isNowFull ? true : quest.isClosed, // Close if full
      };

      // 6. Update quest data
      const success = await questDataManager.updateQuest(guildId, questId, updates, interaction.user);
      if (!success) {
        return interaction.followUp({ content: '⚠️ クエストデータの更新に失敗しました。', ephemeral: true });
      }

      // 7. Update all messages
      const updatedQuest = await questDataManager.getQuest(guildId, questId);
      await updateAllQuestMessages(interaction.client, updatedQuest);

      // 8. Log action
      await logAction(interaction, {
        title: '👍 クエスト受注',
        color: '#2ecc71',
        details: {
          'クエストタイトル': updatedQuest.title || '無題',
          'クエストID': updatedQuest.messageId, // メッセージ再投稿後の新しいIDを使用
          '受注内容': `${teamsNum}組 / ${peopleNum}人`,
        },
      });

      // 9. Send notification
      const notificationChannelId = await questDataManager.getNotificationChannel(guildId);
      if (notificationChannelId) {
        try {
          const notificationChannel = await interaction.client.channels.fetch(notificationChannelId);
          if (notificationChannel?.isTextBased()) {
            const notificationEmbed = new EmbedBuilder().setColor(0x57f287).setTitle('✅ クエスト受注通知').setDescription(`クエスト「${updatedQuest.title || '無題のクエスト'}」に新しい受注がありました。`).addFields({ name: '受注者', value: interaction.user.tag, inline: true },{ name: '受注内容', value: `${teamsNum}組 / ${peopleNum}人`, inline: true },{ name: '受注チャンネル', value: `\`${interaction.channel.name}\``, inline: true }).setTimestamp();
            if (comment) { notificationEmbed.addFields({ name: 'コメント', value: comment }); }
            if (isNowFull) { notificationEmbed.setFooter({ text: 'ℹ️ この受注により、募集が自動的に締め切られました。' }); }
            await notificationChannel.send({ embeds: [notificationEmbed] });
          }
        } catch (error) { console.error(`[${guildId}] Notification failed for quest ${questId}:`, error); }
      }

      // 10. Final reply to user
      let replyMessage = '✅ クエストを受注しました！';
      if (isNowFull) { replyMessage += '\nℹ️ この受注により、募集が定員に達したため自動的に締め切られました。'; }
      await interaction.followUp({ content: replyMessage, ephemeral: true });
    } catch (error) {
      console.error('クエスト受注の処理中にエラーが発生しました:', error);
      await interaction.followUp({ content: 'エラーが発生したため、クエストを受注できませんでした。', ephemeral: true }).catch(console.error);
    }
  },
};