// e:/共有フォルダ/legion/chat_gpt_bot/interactions/buttons/configRemoveTodayChannel.js
const { MessageFlags } = require('discord.js');
const { isChatGptAdmin } = require('../../../permissionManager');
const { setChatGPTConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
    customId: 'chatgpt_config_remove_today_channel',
    async handle(interaction) {
        try {
            await interaction.deferUpdate();

            if (!(await isChatGptAdmin(interaction))) {
                return interaction.followUp({ content: '🚫 この操作を実行する権限がありません。', flags: MessageFlags.Ephemeral });
            }

            await setChatGPTConfig(interaction.guildId, { today_gpt_channel_id: null });

            await interaction.update({
                content: '✅ 「今日のChatGPT」投稿チャンネルの設定を解除しました。\n再度 `/legion_chatgpt_設定` を実行して確認してください。',
                components: [],
            });
        } catch (error) {
            await handleInteractionError({ interaction, error, context: '「今日のChatGPT」チャンネル設定解除' });
        }
    }
};