// quest_bot/interactions/modals/questEditSubmit.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { logAction } = require('../../utils/logger');
const { updateQuestMessage } = require('../../utils/questMessageManager');

module.exports = {
  customId: 'quest_submit_editModal_', // Prefix match
  async handle(interaction) {
    try {
      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

      const questId = interaction.customId.split('_')[3];
      const guildId = interaction.guildId;

      // 1. Get data from modal
      const title = interaction.fields.getTextInputValue('quest_title');
      const description = interaction.fields.getTextInputValue('quest_description');
      const teamsStr = interaction.fields.getTextInputValue('quest_teams');
      const peopleStr = interaction.fields.getTextInputValue('quest_people');
      const deadline = interaction.fields.getTextInputValue('quest_deadline');

      // 2. Validate data
      const teams = parseInt(teamsStr, 10);
      const people = parseInt(peopleStr, 10);

      if (isNaN(teams) || isNaN(people) || teams < 0 || people < 0) {
        return interaction.editReply({ content: '⚠️ 組数と人数には0以上の半角数字を入力してください。' });
      }

      if (deadline) {
        const deadlineRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
        if (!deadlineRegex.test(deadline)) {
          return interaction.editReply({ content: '⚠️ 期限の形式が正しくありません。「YYYY-MM-DD HH:MM」の形式で入力してください。(例: 2024-12-31 23:59)' });
        }
      }

      // 3. Update quest data
      const updates = {
        title,
        description,
        teams,
        people,
        deadline: deadline || null, // 空文字の場合はnullを保存
      };

      const success = await questDataManager.updateQuest(guildId, questId, updates, interaction.user);
      if (!success) {
        return interaction.editReply({ content: '⚠️ クエストデータの更新に失敗しました。' });
      }

      // 4. Update the quest message
      const updatedQuest = await questDataManager.getQuest(guildId, questId);
      await updateQuestMessage(interaction.client, updatedQuest);

      // 5. Log action
      await logAction(interaction, {
        title: '📝 クエスト編集',
        color: '#f1c40f', // yellow
        details: {
          'クエストタイトル': updatedQuest.title || '無題',
          'クエストID': updatedQuest.messageId,
        },
      });

      await interaction.editReply({ content: '✅ クエストの内容を更新しました。' });
    } catch (error) {
      console.error('クエスト編集の処理中にエラーが発生しました:', error);
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: 'エラーが発生したため、クエストを編集できませんでした。' }).catch(console.error);
      } else {
        await interaction.reply({ content: 'エラーが発生したため、クエストを編集できませんでした。', flags: [MessageFlags.Ephemeral] }).catch(console.error);
      }
    }
  },
};