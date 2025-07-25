const { MessageFlags } = require('discord.js');
const { isChatGptAdmin } = require('../../../permissionManager');
const { setChatGPTConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
    customId: 'chatgpt_config_select_today_channel',
    async handle(interaction) {
        try {
            await interaction.deferUpdate();

            if (!(await isChatGptAdmin(interaction))) {
                return interaction.followUp({
                    content: '🚫 この操作を実行する権限がありません。',
                    flags: MessageFlags.Ephemeral
                });
            }

            const selectedChannelId = interaction.values[0];

            if (!selectedChannelId) {
                return interaction.followUp({
                    content: '⚠️ チャンネルが選択されていません。',
                    flags: MessageFlags.Ephemeral
                });
            }

            await setChatGPTConfig(interaction.guildId, {
                today_gpt_channel_id: selectedChannelId
            });

            await interaction.update({
                content: `✅ 「今日のChatGPT」投稿チャンネルを <#${selectedChannelId}> に設定しました。\n再度 \`/legion_chatgpt_使用率\` を実行して確認してください。`,
                components: [],
            });

            return;

        } catch (error) {
            await handleInteractionError({
                interaction,
                error,
                context: '「今日のChatGPT」チャンネル保存'
            });
        }
    }
};
