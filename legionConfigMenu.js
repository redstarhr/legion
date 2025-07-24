const { ActionRowBuilder, RoleSelectMenuBuilder } = require('discord.js');

module.exports = {
    customId: 'legion_config_select_type',
    async handle(interaction) {
        const selectedType = interaction.values[0];

        const row = new ActionRowBuilder()
            .addComponents(
                new RoleSelectMenuBuilder()
                    .setCustomId(`legion_config_set_role_${selectedType}`)
                    .setPlaceholder('設定するロールを選択してください')
            );

        let content = '';
        switch (selectedType) {
            case 'legion_admin':
                content = 'Bot全体の管理者として設定したいロールを選択してください。';
                break;
            case 'quest_admin':
                content = 'クエスト機能の管理者として設定したいロールを選択してください。';
                break;
            case 'chat_gpt_admin':
                content = 'ChatGPT機能の管理者として設定したいロールを選択してください。';
                break;
        }

        await interaction.update({
            content: content,
            components: [row],
        });
    },
};