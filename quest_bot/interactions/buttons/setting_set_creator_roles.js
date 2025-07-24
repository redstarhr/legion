const { ActionRowBuilder, RoleSelectMenuBuilder } = require('discord.js');
const configDataManager = require('../../../configDataManager');

module.exports = {
    customId: 'setting_set_creator_roles',
    async handle(interaction) {
        const config = await configDataManager.getLegionConfig(interaction.guildId);
        const currentRoles = config.questCreatorRoleIds || [];

        const row = new ActionRowBuilder()
            .addComponents(
                new RoleSelectMenuBuilder()
                    .setCustomId('setting_select_creator_roles')
                    .setPlaceholder('クエストを作成できるロールを選択 (複数可)')
                    .setMinValues(0) // Allows clearing the setting
                    .setMaxValues(10) // Set a reasonable limit
                    .setDefaultRoles(currentRoles)
            );

        await interaction.update({
            content: 'クエストの作成や管理を許可するロールを選択してください。\n選択をすべて解除すると、この設定は無効になります。',
            components: [row],
        });
    },
};