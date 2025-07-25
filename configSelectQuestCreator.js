// e:/共有フォルダ/legion/admin_bot/interactions/selectMenus/configSelectQuestCreator.js
const { isLegionAdmin } = require('../../../permissionManager');
const { setQuestCreatorRoleIds } = require('../../../manager/configDataManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { createLegionConfigPanel } = require('../../components/configPanel');
const { QUEST_CREATOR_ROLE_SELECT } = require('../../utils/customIds');

module.exports = {
    customId: QUEST_CREATOR_ROLE_SELECT,
    async handle(interaction) {
        try {
            if (!(await isLegionAdmin(interaction))) {
                return interaction.reply({ content: '🚫 この操作を実行する権限がありません。', ephemeral: true });
            }

            await interaction.deferUpdate();

            const selectedRoleIds = interaction.values; // 複数選択なので配列
            await setQuestCreatorRoleIds(interaction.guildId, selectedRoleIds);

            const updatedPanel = await createLegionConfigPanel(interaction);
            await interaction.editReply(updatedPanel);
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'クエスト作成者ロール設定' });
        }
    }
};