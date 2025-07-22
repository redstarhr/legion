// quest_bot/components/questActionButtons.js

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * クエストの現在の状態に基づいてアクションボタンの行を生成します。
 * @param {object} quest - クエストオブジェクト
 * @param {string} userId - インタラクションを実行したユーザーのID (主にボタンの有効/無効のヒントに使う)
 * @returns {ActionRowBuilder}
 */
function createQuestActionRow(quest, userId) {
  const isClosed = quest.isClosed || quest.isArchived;

  const row = new ActionRowBuilder();

  // 受注ボタン
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`quest_accept_${quest.messageId}`)
      .setLabel('受注する')
      .setStyle(ButtonStyle.Success)
      .setDisabled(isClosed)
  );

  // 受注取消ボタン
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`quest_cancel_${quest.messageId}`)
      .setLabel('受注取消')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(isClosed)
  );

  // 編集ボタン
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`quest_edit_${quest.messageId}`)
      .setLabel('編集')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(isClosed) // 実際の権限チェックはボタンハンドラ側で行う
  );

  // 参加者に連絡ボタン
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`quest_dm_${quest.messageId}`)
      .setLabel('参加者に連絡')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(isClosed || !quest.accepted || quest.accepted.length === 0)
  );

  // 募集〆切/募集再開/アーカイブボタン
  if (quest.isArchived) {
    // アーカイブ済みの場合は、無効化されたボタンを表示
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`quest_archived_${quest.messageId}`)
        .setLabel('アーカイブ済')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );
  } else if (quest.isClosed) {
    // 〆切済みの場合は、「募集再開」ボタンを表示
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`quest_reopen_${quest.messageId}`)
        .setLabel('募集再開')
        .setStyle(ButtonStyle.Primary),
      // 〆切済みの場合は、「クエスト完了」ボタンも表示
      new ButtonBuilder()
        .setCustomId(`quest_archive_${quest.messageId}`)
        .setLabel('クエスト完了')
        .setStyle(ButtonStyle.Secondary)
    );
  } else {
    // 募集中の場合は、「募集〆切」ボタンを表示
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`quest_close_${quest.messageId}`)
        .setLabel('募集〆切')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  return row;
}

module.exports = { createQuestActionRow };