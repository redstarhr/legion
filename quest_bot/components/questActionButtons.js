// e:/共有フォルダ/legion/quest_bot/components/questActionButtons.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const configDataManager = require('../../manager/configDataManager');

/**
 * Creates the action row of buttons for a quest message based on the quest's state and guild configuration.
 * @param {object} quest The quest object.
 * @param {string} guildId The ID of the guild.
 * @returns {Promise<ActionRowBuilder>} A promise that resolves to the action row builder.
 */
async function createQuestActionButtons(quest, guildId) {
    const buttonOrder = await configDataManager.getButtonOrder(guildId);
    const row = new ActionRowBuilder();

    const buttonMap = {
        accept: new ButtonBuilder()
            .setCustomId(`quest_open_acceptModal_${quest.id}`)
            .setLabel('受注する')
            .setStyle(ButtonStyle.Success)
            .setDisabled(quest.isClosed || quest.isArchived),
        cancel: new ButtonBuilder()
            .setCustomId(`quest_open_cancelConfirm_${quest.id}`)
            .setLabel('受注取消')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(quest.isArchived),
        edit: new ButtonBuilder()
            .setCustomId(`quest_edit_${quest.id}`)
            .setLabel('編集')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(quest.isArchived),
        dm: new ButtonBuilder()
            .setCustomId(`quest_open_dmModal_${quest.id}`)
            .setLabel('参加者に連絡')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(quest.isArchived),
    };

    const specialButtons = {
        reopen: new ButtonBuilder()
            .setCustomId(`quest_toggle_reopen_${quest.id}`)
            .setLabel('募集再開')
            .setStyle(ButtonStyle.Success),
        download: new ButtonBuilder()
            .setCustomId(`quest_action_downloadCsv_${quest.id}`)
            .setLabel('参加者リストDL')
            .setStyle(ButtonStyle.Secondary),
    };

    const buttonsToShow = [];
    if (quest.isArchived) {
        buttonsToShow.push(specialButtons.download);
    } else if (quest.isClosed) {
        buttonsToShow.push(specialButtons.reopen, specialButtons.download);
    } else {
        for (const key of buttonOrder) {
            if (buttonMap[key]) buttonsToShow.push(buttonMap[key]);
        }
        buttonsToShow.push(specialButtons.download);
    }

    row.addComponents(buttonsToShow.slice(0, 5));

    return row;
}

module.exports = { createQuestActionButtons };