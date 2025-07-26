const { ActionRowBuilder, RoleSelectMenuBuilder } = require('discord.js');
const { getQuestConfig } = require('../../utils/configManager');

module.exports = {
    customId: 'setting_set_acceptance_roles',
    async handle(interaction) {
        const config = await getQuestConfig(interaction.guildId);
        const currentRoles = config.questAcceptanceRoleIds || [];

        const row = new ActionRowBuilder()
            .addComponents(
                new RoleSelectMenuBuilder()
                    .setCustomId('setting_select_acceptance_roles')
                    .setPlaceholder('クエストを受注できるロールを選択 (複数可)')
                    .setMinValues(0) // Allows clearing the setting
                    .setMaxValues(10) // Set a reasonable limit
                    .setDefaultRoles(currentRoles)
            );

        await interaction.update({
            content: 'クエストの受注を許可するロールを選択してください。\n選択をすべて解除すると、誰でも受注可能になります。',
            components: [row],
        });
    },
};