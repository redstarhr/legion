const configDataManager = require('../../../manager/configDataManager');
const { createConfigPanel } = require('../../components/configPanel');
const { handleInteractionError } = require('../../../interactionErrorLogger');

const { logAction } = require('../../utils/logger');
module.exports = {
    customId: 'setting_select_creator_roles',
    async handle(interaction) {
        try {
            await interaction.deferUpdate();

            const selectedRoleIds = interaction.values;
            await configDataManager.setQuestCreatorRoleIds(interaction.guildId, selectedRoleIds);

            let successMessage;
            if (selectedRoleIds.length > 0) {
                const roles = await Promise.all(selectedRoleIds.map(id => interaction.guild.roles.fetch(id)));
                const roleNames = roles.map(r => `**${r.name}**`);
                successMessage = `✅ クエスト作成者ロールを ${roleNames.join(', ')} に設定しました。`;
            } else {
                successMessage = '✅ クエスト作成者ロールの設定を解除しました。';
            }

            await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
                title: '⚙️ クエスト作成者ロール設定',
                description: successMessage,
                color: '#95a5a6',
            });

            const newView = await createConfigPanel(interaction);
            await interaction.editReply({
                content: successMessage,
                ...newView,
            });
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'クエスト作成者ロール設定' });
        }
    },
};