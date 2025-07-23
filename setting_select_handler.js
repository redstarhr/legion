const questDataManager = require('../../utils/questDataManager');

async function handleChannelSelect(interaction) {
    const channelId = interaction.values[0];
    await questDataManager.setLogChannel(interaction.guildId, channelId);
    await interaction.update({
        content: `✅ ログチャンネルを <#${channelId}> に設定しました。`,
        components: [],
    });
}

async function handleRoleSelect(interaction) {
    const roleId = interaction.values[0];
    await questDataManager.setQuestManagerRole(interaction.guildId, roleId);
    await interaction.update({
        content: `✅ クエスト管理者ロールを <@&${roleId}> に設定しました。`,
        components: [],
    });
}

module.exports = {
    // 複数のcustomIdを1つのファイルで処理する例
    customId: 'setting_select_', // prefix
    async handle(interaction) {
        if (interaction.customId === 'setting_select_log_channel') await handleChannelSelect(interaction);
        if (interaction.customId === 'setting_select_manager_role') await handleRoleSelect(interaction);
    }
};