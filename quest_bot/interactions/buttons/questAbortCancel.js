// e:/共有フォルダ/legion/quest_bot/interactions/buttons/questAbortCancel.js
const { QUEST_ABORT_CANCEL } = require('../../utils/customIds');

module.exports = {
    customId: QUEST_ABORT_CANCEL,
    async handle(interaction) {
        await interaction.update({ content: '操作をキャンセルしました。', components: [] });
    }
};