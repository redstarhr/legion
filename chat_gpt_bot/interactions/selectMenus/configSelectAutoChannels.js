// e:/共有フォルダ/legion/chat_gpt_bot/interactions/selectMenus/configSelectAutoChannels.js
const { MessageFlags } = require('discord.js');
const { isChatGptAdmin } = require('../../../permissionManager');
const { setChatGPTConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
    customId: 'chatgpt_config_select_auto_channels',
    async handle(interaction) {
        try {
            await interaction.deferUpdate();

            if (!(await isChatGptAdmin(interaction))) {
                return interaction.followUp({ content: '🚫 この操作を実行する権限がありません。', flags: MessageFlags.Ephemeral });
            }

            const selectedChannelIds = interaction.values;

            await setChatGPTConfig(interaction.guildId, { chat_gpt_channels: selectedChannelIds });

            await interaction.update({
                content: '✅ 自動応答チャンネルの設定を更新しました。\n再度 `/legion_chatgpt_使用率` を実行して確認してください。',
                components: [],
            });
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ChatGPT自動応答チャンネル保存' });
        }
    }
};