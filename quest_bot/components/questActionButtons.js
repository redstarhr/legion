// quest_bot/components/questActionButtons.js

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const questDataManager = require('../utils/questDataManager');

/**
 * クエストの現在の状態に基づいてアクションボタンの行を生成します。
 * @param {object} quest - クエストオブジェクト
 * @returns {Promise<ActionRowBuilder[]>} An array of action rows.
 */
async function createQuestActionRows(quest) {
  const isClosed = quest.isClosed || quest.isArchived;
  const guildId = quest.guildId;

  // Define all possible main action buttons
  const allButtons = {
    accept: new ButtonBuilder()
      .setCustomId(`quest_open_acceptModal_${quest.messageId}`)
      .setLabel('受注する')
      .setStyle(ButtonStyle.Success)
      .setDisabled(isClosed),
    cancel: new ButtonBuilder()
      .setCustomId(`quest_open_cancelConfirm_${quest.messageId}`)
      .setLabel('受注取消')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(isClosed),
    edit: new ButtonBuilder()
      .setCustomId(`quest_open_editModal_${quest.messageId}`)
      .setLabel('編集')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(isClosed),
    dm: new ButtonBuilder()
      .setCustomId(`quest_open_dmModal_${quest.messageId}`)
      .setLabel('参加者に連絡')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(isClosed || !quest.accepted || quest.accepted.length === 0),
  };

  // Get custom order from the database
  const buttonOrder = await questDataManager.getButtonOrder(guildId);

  // Build the first row based on the custom order
  const mainActionRow = new ActionRowBuilder();
  for (const key of buttonOrder) {
    if (allButtons[key]) {
      mainActionRow.addComponents(allButtons[key]);
    }
  }

  // Build the second row for state management
  const stateManagementRow = new ActionRowBuilder();
  if (quest.isArchived) {
    // アーカイブ済みの場合は、無効化されたボタンを表示
    stateManagementRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`quest_archived_${quest.messageId}`)
        .setLabel('アーカイブ済')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );
  } else if (quest.isClosed) {
    // 〆切済みの場合は、「募集再開」と「クエスト完了」ボタンを表示
    stateManagementRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`quest_toggle_reopen_${quest.messageId}`)
        .setLabel('募集再開')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`quest_open_archiveConfirm_${quest.messageId}`)
        .setLabel('クエスト完了')
        .setStyle(ButtonStyle.Secondary)
    );
  } else {
    // 募集中の場合は、「募集〆切」ボタンを表示
    stateManagementRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`quest_open_closeConfirm_${quest.messageId}`)
        .setLabel('募集〆切')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  // アーカイブされていないクエストには、ユーティリティボタンを追加
  if (!quest.isArchived) {
    stateManagementRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`quest_action_downloadCsv_${quest.messageId}`)
        .setLabel('参加者リストDL')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!quest.accepted || quest.accepted.length === 0)
    );
  }

  const rows = [];
  if (mainActionRow.components.length > 0) {
    rows.push(mainActionRow);
  }
  if (stateManagementRow.components.length > 0) {
    rows.push(stateManagementRow);
  }

  return rows;
}

module.exports = { createQuestActionRows };