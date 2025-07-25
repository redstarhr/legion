// e:/共有フォルダ/legion/admin_bot/interactions/selectMenus/configSelectLegionAdmin.js
const { isLegionAdmin } = require('../../../permissionManager');
const { setLegionAdminRole } = require('../../../manager/configDataManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { createLegionConfigPanel } = require('../../components/configPanel');
const { LEGION_ADMIN_ROLE_SELECT } = require('../../utils/customIds');

module.exports = {
    customId: LEGION_ADMIN_ROLE_SELECT,
    async handle(interaction) {
        try {
            if (!(await isLegionAdmin(interaction))) {
                return interaction.reply({ content: '🚫 この操作を実行する権限がありません。', ephemeral: true });
            }

            await interaction.deferUpdate();

            const selectedRoleId = interaction.values[0] || null; // 選択がなければnull（設定解除）
            await setLegionAdminRole(interaction.guildId, selectedRoleId);

            const updatedPanel = await createLegionConfigPanel(interaction);
            await interaction.editReply(updatedPanel);
        } catch (error) {
            await handleInteractionError({ interaction, error, context: '全体管理者ロール設定' });
        }
    }
};