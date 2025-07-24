const { saveChatGPTConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../../interactionErrorLogger');

module.exports = {
    customId: 'chatgpt_config_select_channels',
    async handle(interaction) {
        try {
            await interaction.deferUpdate();

            const selectedChannelIds = interaction.values;

            await saveChatGPTConfig(interaction.guildId, { chat_gpt_channels: selectedChannelIds });

            let successMessage;
            if (selectedChannelIds.length > 0) {
                successMessage = `✅ ChatGPTの対応チャンネルを ${selectedChannelIds.map(id => `<#${id}>`).join(', ')} に設定しました。`;
            } else {
                successMessage = '✅ ChatGPTの対応チャンネルをすべて解除しました。';
            }

            await interaction.editReply({
                content: successMessage,
                components: [],
                embeds: [],
            });

        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ChatGPT対応チャンネル更新' });
        }
    },
};