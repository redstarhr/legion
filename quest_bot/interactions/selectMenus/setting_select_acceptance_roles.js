const { setQuestAcceptanceRoleIds } = require('../../utils/configManager');
const { createConfigPanel } = require('../../components/configPanel');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

const { logAction } = require('../../utils/logger');
module.exports = {
    customId: 'setting_select_acceptance_roles',
    async handle(interaction) {
        try {
            await interaction.deferUpdate();

            const selectedRoleIds = interaction.values;
            await setQuestAcceptanceRoleIds(interaction.guildId, selectedRoleIds);

            let successMessage;
            if (selectedRoleIds.length > 0) {
                const roles = await Promise.all(selectedRoleIds.map(id => interaction.guild.roles.fetch(id)));
                const roleNames = roles.map(r => `**${r.name}**`);
                successMessage = `✅ クエスト受注可能ロールを ${roleNames.join(', ')} に設定しました。`;
            } else {
                successMessage = '✅ クエスト受注可能ロールの設定を解除しました。';
            }

            await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
                title: '⚙️ クエスト受注ロール設定',
                description: successMessage,
                color: '#95a5a6',
            });

            const newView = await createConfigPanel(interaction);
            await interaction.editReply({
                content: successMessage,
                ...newView,
            });
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'クエスト受注ロール設定' });
        }
    },
};