// e:/共有フォルダ/legion/chat_gpt_bot/interactions/buttons/configEditAutoChannels.js
const { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType, MessageFlags } = require('discord.js');
const { isChatGptAdmin } = require('../../../permissionManager');
const { getChatGPTConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
    customId: 'chatgpt_config_edit_auto_channels',
    async handle(interaction) {
        try {
            if (!(await isChatGptAdmin(interaction))) {
                return interaction.reply({ content: '🚫 この操作を実行する権限がありません。', flags: MessageFlags.Ephemeral });
            }

            const config = await getChatGPTConfig(interaction.guildId);
            const currentChannels = config.chat_gpt_channels || [];

            const selectMenu = new ChannelSelectMenuBuilder()
                .setCustomId('chatgpt_config_select_auto_channels')
                .setPlaceholder('自動応答を有効にするチャンネルを選択 (複数可)')
                .addChannelTypes(ChannelType.GuildText)
                .setMinValues(0) // 選択解除を許可
                .setMaxValues(25) // Discordの制限
                .setDefaultChannels(currentChannels);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.update({
                content: 'ユーザーのメッセージにChatGPTが自動で応答するチャンネルを設定してください。\n選択をすべて解除すると、この機能は無効になります。',
                components: [row],
            });
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ChatGPT自動応答チャンネル設定UI' });
        }
    }
};