// components/questActionButtons.js

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * クエストの状態に基づいてアクションボタンの行を生成する
 * @param {object} quest - クエストオブジェクト
 * @param {string} [userId] - ボタンを表示するユーザーのID (オプション)
 * @returns {ActionRowBuilder}
 */
function createQuestActionRow(quest, userId = null) {
  // 現在の受注合計を計算
  const currentAcceptedTeams = quest.accepted?.reduce((sum, a) => sum + a.teams, 0) || 0;
  const currentAcceptedPeople = quest.accepted?.reduce((sum, a) => sum + a.people, 0) || 0;

  // 募集が0、または募集数に達している場合は「受注」を無効化
  const isRecruitmentOver = quest.isClosed || quest.teams === 0 || currentAcceptedTeams >= quest.teams || currentAcceptedPeople >= quest.people;
  
  // ユーザーがこのクエストを受注しているかチェック
  const hasAccepted = userId && quest.accepted?.some(a => a.userId === userId);

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('quest_accept_modal') // 受注モーダルを呼び出すID
      .setLabel('✅ 受注')
      .setStyle(ButtonStyle.Success)
      .setDisabled(quest.isArchived || isRecruitmentOver), // 状況に応じて無効化
    new ButtonBuilder()
      .setCustomId('quest_cancel_button') // 受注取り消しボタンのID
      .setLabel('❌ 取り消し')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(quest.isArchived || !hasAccepted), // ユーザーが受注している場合のみ有効化
    new ButtonBuilder()
      .setCustomId('quest_edit_modal')
      .setLabel('発注/修正') // ボタンを統合
      .setStyle(ButtonStyle.Primary)
      .setDisabled(quest.isArchived), // アーカイブ済みは修正不可
    new ButtonBuilder()
      .setCustomId('quest_reopen_button') // クエスト再開ボタン
      .setLabel('🔄 再開')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(quest.isArchived || !quest.isClosed), // アーカイブ済みか、クローズ状態でなければ無効
    new ButtonBuilder()
      .setCustomId('quest_archive_button') // クエスト完了ボタン
      .setLabel('📁 完了')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(quest.isArchived)
  );
}

module.exports = { createQuestActionRow };