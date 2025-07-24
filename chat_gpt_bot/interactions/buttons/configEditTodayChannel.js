// e:/共有フォルダ/legion/chat_gpt_bot/interactions/buttons/configEditTodayChannel.js
const { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { isChatGptAdmin } = require('../../../permissionManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
    customId: 'chatgpt_config_edit_today_channel',
    async handle(interaction) {
        try {
            if (!(await isChatGptAdmin(interaction))) {
                return interaction.reply({ content: '🚫 この操作を実行する権限がありません。', flags: MessageFlags.Ephemeral });
            }

            const selectMenu = new ChannelSelectMenuBuilder()
                .setCustomId('chatgpt_config_select_today_channel')
                .setPlaceholder('「今日のChatGPT」を投稿するチャンネルを選択')
                .addChannelTypes(ChannelType.GuildText)
                .setMinValues(1)
                .setMaxValues(1);

            const removeButton = new ButtonBuilder()
                .setCustomId('chatgpt_config_remove_today_channel')
                .setLabel('設定を解除')
                .setStyle(ButtonStyle.Danger);

            const row1 = new ActionRowBuilder().addComponents(selectMenu);
            const row2 = new ActionRowBuilder().addComponents(removeButton);

            await interaction.update({
                content: '`/今日のchatgpt` コマンドの結果を投稿するチャンネルを選択するか、設定を解除してください。',
                components: [row1, row2],
            });
        } catch (error) {
            await handleInteractionError({ interaction, error, context: '「今日のChatGPT」チャンネル設定UI' });
        }
    }
};