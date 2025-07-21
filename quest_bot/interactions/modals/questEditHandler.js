// interactions/modals/questEditHandler.js

const questDataManager = require('../../utils/questDataManager');
const { updateAllQuestMessages } = require('../../utils/messageUpdater');
const { logAction } = require('../../utils/logger');

module.exports = {
  customId: 'quest_edit_submit_',

  async handle(interaction) {
    await interaction.deferUpdate();

    const originalMessageId = interaction.customId.split('_')[3];
    const guildId = interaction.guildId;

    const title = interaction.fields.getTextInputValue('quest_title_input');
    const description = interaction.fields.getTextInputValue('quest_description_input');
    const teams = interaction.fields.getTextInputValue('teams_input');
    const people = interaction.fields.getTextInputValue('people_input');
    const deadline = interaction.fields.getTextInputValue('quest_deadline_input');

    const teamsNum = parseInt(teams, 10);
    const peopleNum = parseInt(people, 10);

    if (isNaN(teamsNum) || isNaN(peopleNum)) {
      return interaction.followUp({ content: '⚠️ 組数と人数には数値を入力してください。', ephemeral: true });
    }

    // 1. データを更新
    await questDataManager.updateQuest(guildId, originalMessageId, {
      title,
      description,
      teams: teamsNum,
      people: peopleNum,
      deadline: deadline || null,
      issuerId: interaction.user.id, // 修正者を発注者として更新
      isClosed: false, // 募集内容が変更されたので、クローズ状態をリセット
    });

    // 2. 更新後のクエスト情報を取得
    const quest = await questDataManager.getQuest(guildId, originalMessageId);
    if (!quest) {
      return interaction.followUp({ content: '⚠️ クエストデータの特定に失敗しました。', ephemeral: true });
    }

    // 3. 共通関数を使って全ての関連メッセージを更新
    await updateAllQuestMessages(interaction.client, quest, interaction.user.id);

    await interaction.followUp({ content: '✅ クエストの内容を修正しました。', ephemeral: true });

    await logAction(interaction, 'クエストを修正', `クエストID: ${originalMessageId}`);
  },
};