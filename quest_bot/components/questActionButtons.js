// quest_bot/components/questActionButtons.js

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const configDataManager = require('../../configDataManager');

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
      .setCustomId(`quest_open_acceptModal_${quest.id}`)
      .setLabel('受注する')
      .setStyle(ButtonStyle.Success)
      .setDisabled(isClosed),
    cancel: new ButtonBuilder()
      .setCustomId(`quest_open_cancelConfirm_${quest.id}`)
      .setLabel('受注取消')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(isClosed),
    edit: new ButtonBuilder()
      .setCustomId(`quest_open_editModal_${quest.id}`)
      .setLabel('編集')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(isClosed),
    dm: new ButtonBuilder()
      .setCustomId(`quest_open_dmModal_${quest.id}`)
      .setLabel('参加者に連絡')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(isClosed || !quest.accepted || quest.accepted.length === 0),
  };

  // Get custom order from the database
  const buttonOrder = await configDataManager.getButtonOrder(guildId);

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
    stateManagementRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`quest_archived_${quest.id}`)
        .setLabel('アーカイブ済')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );
  } else {
    // 募集再開/〆切ボタン
    if (quest.isClosed) {
      stateManagementRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`quest_toggle_reopen_${quest.id}`)
          .setLabel('募集再開')
          .setStyle(ButtonStyle.Primary)
      );
    } else {
      stateManagementRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`quest_open_closeConfirm_${quest.id}`)
          .setLabel('募集〆切')
          .setStyle(ButtonStyle.Secondary)
      );
    }

    // クエスト完了ボタン
    stateManagementRow.addComponents(
      new ButtonBuilder().setCustomId(`quest_open_archiveConfirm_${quest.id}`).setLabel('クエスト完了').setStyle(ButtonStyle.Secondary)
    );
    // 参加者リストDLボタン
    stateManagementRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`quest_action_downloadCsv_${quest.id}`)
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