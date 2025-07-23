// quest_bot/components/dashboardActionButtons.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Creates the main action rows for the quest dashboard.
 * @returns {ActionRowBuilder[]}
 */
function createDashboardActionRows() {
    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('dash_open_addQuestSelect').setLabel('クエスト追加').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('dash_open_editQuestSelect').setLabel('クエスト修正').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('dash_open_archiveQuestSelect').setLabel('クエスト完了').setStyle(ButtonStyle.Secondary),
        );
    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('dash_open_acceptQuestSelect').setLabel('受注').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('dash_open_completeQuestSelect').setLabel('完了').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('dash_open_failQuestSelect').setLabel('失敗').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('dash_open_cancelAcceptanceSelect').setLabel('受注取消').setStyle(ButtonStyle.Secondary),
        );
    return [row1, row2];
}

module.exports = { createDashboardActionRows };