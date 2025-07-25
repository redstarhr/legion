const configDataManager = require('../../../manager/configDataManager');
const { logAction } = require('../../utils/logger');
const { createConfigPanel } = require('../../components/configPanel');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
    customId: 'setting_remove_', // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferUpdate();

            const settingToRemove = interaction.customId.replace('setting_remove_', '');
            let logTitle = '';
            let successMessage = '';

            switch (settingToRemove) {
                case 'log_channel':
                    await configDataManager.setLogChannel(interaction.guildId, null);
                    logTitle = '⚙️ ログチャンネル設定解除';
                    successMessage = '✅ ログチャンネルの設定を解除しました。';
                    break;
                case 'notification_channel':
                    await configDataManager.setNotificationChannel(interaction.guildId, null);
                    logTitle = '⚙️ 通知チャンネル設定解除';
                    successMessage = '✅ 通知チャンネルの設定を解除しました。';
                    break;
                default:
                    console.warn(`[SettingRemove] Unknown setting to remove: ${settingToRemove}`);
                    return interaction.editReply({ content: '不明な設定解除操作です。' });
            }

            if (logTitle) {
                await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
                    title: logTitle,
                    description: successMessage,
                    color: '#95a5a6',
                });
            }

            // Refresh the main config panel
            const newView = await createConfigPanel(interaction);
            await interaction.editReply({ content: successMessage, ...newView });

        } catch (error) {
            await handleInteractionError({ interaction, error, context: `設定解除処理 (${interaction.customId})` });
        }
    }
};