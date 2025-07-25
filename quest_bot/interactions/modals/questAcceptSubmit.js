// quest_bot/interactions/modals/questAcceptSubmit.js
const { EmbedBuilder, MessageFlags } = require('discord.js');
const questDataManager = require('../../../manager/questDataManager');
const { updateQuestMessage } = require('../../utils/questMessageManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');
const { calculateRemainingSlots } = require('../../utils/questUtils');
const { sendAcceptanceNotification } = require('../../utils/notificationManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
  customId: 'quest_submit_acceptModal_', // Prefix match
  async handle(interaction) {
    try {
      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

      const questId = interaction.customId.split('_')[3];
      const guildId = interaction.guildId;

      // 1. Get data from modal
      const peopleStr = interaction.fields.getTextInputValue('accept_people');
      const comment = interaction.fields.getTextInputValue('accept_comment');

      // 2. Validate input
      const teamsNum = 1; // 組数は1で固定
      const peopleNum = parseInt(peopleStr, 10);

      if (isNaN(peopleNum) || peopleNum <= 0) {
        return interaction.editReply({ content: '⚠️ 人数には1以上の半角数字を入力してください。' });
      }

      // 3. Re-fetch quest data to prevent race conditions
      const quest = await questDataManager.getQuest(guildId, questId);
      if (!quest || quest.isClosed || quest.isArchived) {
        return interaction.editReply({ content: '⚠️ このクエストは現在募集を締め切っているか、見つかりませんでした。' });
      }

      // レースコンディション対策で、ここでも重複受注をチェック (失敗以外)
      const hasAlreadyAccepted = quest.accepted?.some(a => a.userId === interaction.user.id && a.status !== 'failed');
      if (hasAlreadyAccepted) {
          return interaction.editReply({ content: '⚠️ あなたは既にこのクエストを受注済みです。' });
      }

      // 4. Check for available slots
      const { remainingTeams, remainingPeople, currentAcceptedTeams, currentAcceptedPeople } = calculateRemainingSlots(quest);

      if (teamsNum > remainingTeams || peopleNum > remainingPeople) {
        return interaction.editReply({ content: `⚠️ 募集枠を超えています。(残り: ${remainingTeams}組 / ${remainingPeople}人)` });
      }

      // 5. Prepare update data
      const newAcceptance = {
        userId: interaction.user.id,
        userTag: interaction.user.tag,
        channelName: interaction.channel.name,
        teams: teamsNum,
        people: peopleNum,
        players: peopleNum, // 互換性のために両方追加
        comment: comment || null,
        timestamp: Date.now(),
      };

      const updatedAccepted = [...(quest.accepted || []), newAcceptance];

      // Check if the quest is now full
      const newTotalTeams = currentAcceptedTeams + teamsNum;
      const newTotalPeople = currentAcceptedPeople + peopleNum; // Use the same variable as above
      const isNowFull = newTotalTeams >= (quest.teams || 1) && newTotalPeople >= (quest.people || quest.players || 1);

      const updates = {
        accepted: updatedAccepted,
        isClosed: isNowFull ? true : quest.isClosed, // Close if full
      };

      // 6. Update quest data
      const updatedQuest = await questDataManager.updateQuest(guildId, questId, updates, interaction.user);
      if (!updatedQuest) {
        return interaction.editReply({ content: '⚠️ クエストデータの更新に失敗しました。' });
      }

      // 7. Update all messages
      await updateQuestMessage(interaction.client, updatedQuest);
      await updateDashboard(interaction.client, guildId);

      // 8. Log action
      await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
        title: '👍 クエスト受注',
        color: '#2ecc71',
        details: {
          'クエストタイトル': updatedQuest.title || '無題', // Use updatedQuest for consistency
          'クエストID': questId,
          '受注人数': `${peopleNum}人`,
        },
      });

      // 9. Send notification
      await sendAcceptanceNotification({ interaction, quest: updatedQuest, acceptance: newAcceptance, wasFull: isNowFull });

      // 10. Final reply to user
      let replyMessage = '✅ クエストを受注しました！';
      if (isNowFull) { replyMessage += '\nℹ️ この受注により、募集が定員に達したため自動的に締め切られました。'; }
      await interaction.editReply({ content: replyMessage });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'クエスト受注処理' });
    }
  },
};