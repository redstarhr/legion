// e:/共有フォルダ/legion/admin_bot/interactions/selectMenus/configSelectChatgptAdmin.js
const { isLegionAdmin } = require('../../../permissionManager');
const { setChatGptAdminRole } = require('../../../manager/configDataManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { createLegionConfigPanel } = require('../../components/configPanel');
const { CHATGPT_ADMIN_ROLE_SELECT } = require('../../utils/customIds');

module.exports = {
    customId: CHATGPT_ADMIN_ROLE_SELECT,
    async handle(interaction) {
        try {
            if (!(await isLegionAdmin(interaction))) {
                return interaction.reply({ content: '🚫 この操作を実行する権限がありません。', ephemeral: true });
            }

            await interaction.deferUpdate();

            const selectedRoleId = interaction.values[0] || null;
            await setChatGptAdminRole(interaction.guildId, selectedRoleId);

            const updatedPanel = await createLegionConfigPanel(interaction);
            await interaction.editReply(updatedPanel);
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ChatGPT管理者ロール設定' });
        }
    }
};