// e:/共有フォルダ/legion/admin_bot/interactions/selectMenus/configSelectQuestAdmin.js
const { isLegionAdmin } = require('../../../manager/permissionManager');
const { setQuestAdminRole } = require('../../../manager/configDataManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { createLegionConfigPanel } = require('../../components/configPanel');
const { QUEST_ADMIN_ROLE_SELECT } = require('../../utils/customIds');

module.exports = {
    customId: QUEST_ADMIN_ROLE_SELECT,
    async handle(interaction) {
        try {
            if (!(await isLegionAdmin(interaction))) {
                return interaction.reply({ content: '🚫 この操作を実行する権限がありません。', ephemeral: true });
            }

            await interaction.deferUpdate();

            const selectedRoleId = interaction.values[0] || null;
            await setQuestAdminRole(interaction.guildId, selectedRoleId);

            const updatedPanel = await createLegionConfigPanel(interaction);
            await interaction.editReply(updatedPanel);
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'クエスト管理者ロール設定' });
        }
    }
};