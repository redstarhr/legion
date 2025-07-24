const configDataManager = require('../../../configDataManager');

module.exports = {
    customId: 'setting_select_creator_roles',
    async handle(interaction) {
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

        await interaction.editReply({
            content: successMessage,
            components: [], // Clear the UI
        });
    },
};