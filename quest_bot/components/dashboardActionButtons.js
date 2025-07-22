// quest_bot/components/dashboardActionButtons.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Creates the main action rows for the quest dashboard.
 * @returns {ActionRowBuilder[]}
 */
function createDashboardActionRows() {
    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('dash_add_quest').setLabel('クエスト追加').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('dash_edit_quest').setLabel('クエスト修正').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('dash_archive_quest').setLabel('クエスト完了').setStyle(ButtonStyle.Secondary),
        );
    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('dash_accept_quest').setLabel('受注').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('dash_cancel_acceptance').setLabel('受注取消').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('dash_complete_quest').setLabel('討伐').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('dash_fail_quest').setLabel('失敗').setStyle(ButtonStyle.Danger),
        );
    return [row1, row2];
}

module.exports = { createDashboardActionRows };