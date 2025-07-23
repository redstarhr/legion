const { MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { logAction } = require('../../utils/logger');
const { createConfigPanel } = require('../../components/configPanel');
const { replyWithConfirmation } = require('../../components/confirmationUI');

module.exports = {
    customId: 'config_remove_',
    async handle(interaction) {
        try {
            // Handle dashboard removal separately due to confirmation step
            if (interaction.customId === 'config_remove_dashboard') {
                await replyWithConfirmation(interaction, {
                    content: '本当にクエスト掲示板を削除しますか？\nこの操作は元に戻せません。掲示板は `/クエスト掲示板設置` コマンドで再設置できます。',
                    confirmCustomId: 'config_confirm_deleteDashboard', // Handled by configDeleteDashboardConfirm.js
                    confirmLabel: 'はい、削除します',
                    cancelCustomId: 'config_cancel_deleteDashboard', // Handled by configDeleteDashboardCancel.js
                });
                return;
            }

            // Handle simple removals
            await interaction.deferUpdate();

            let logTitle = '';
            let successMessage = '';

            switch (interaction.customId) {
                case 'config_remove_log_channel':
                    await questDataManager.setLogChannel(interaction.guildId, null);
                    logTitle = '⚙️ ログチャンネル設定解除';
                    successMessage = '✅ ログチャンネルの設定を解除しました。';
                    break;
                case 'config_remove_manager_role':
                    await questDataManager.setQuestManagerRole(interaction.guildId, null);
                    logTitle = '⚙️ 管理者ロール設定解除';
                    successMessage = '✅ 管理者ロールの設定を解除しました。';
                    break;
                case 'config_remove_notification_channel':
                    await questDataManager.setNotificationChannel(interaction.guildId, null);
                    logTitle = '⚙️ 通知チャンネル設定解除';
                    successMessage = '✅ 通知チャンネルの設定を解除しました。';
                    break;
            }

            if (logTitle) {
                await logAction(interaction, {
                    title: logTitle,
                    description: successMessage,
                    color: '#95a5a6',
                });
            }

            // Refresh the panel
            const newView = await createConfigPanel(interaction);
            await interaction.editReply(newView);

        } catch (error) {
            console.error('設定解除処理中にエラーが発生しました:', error);
            await interaction.followUp({ content: 'エラーが発生したため、設定を解除できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
        }
    }
};