// e:/共有フォルダ/legion/chat_gpt_bot/interactions/buttons/chatgpt_panel_open_config_modal.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { isChatGptAdmin } = require('../../../manager/permissionManager');
const { getChatGPTConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { gptConfigModal, gptSystemPromptInput, gptTemperatureInput, gptModelInput } = require('../../utils/customIds');

module.exports = {
    customId: 'chatgpt_panel_open_config_modal',
    async handle(interaction) {
        try {
            if (!(await isChatGptAdmin(interaction))) {
                return interaction.reply({ content: '🚫 この操作を実行する権限がありません。', flags: MessageFlags.Ephemeral });
            }

            const gptConfig = await getChatGPTConfig(interaction.guildId);

            const modal = new ModalBuilder()
                .setCustomId(gptConfigModal)
                .setTitle('ChatGPT 設定の編集');

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId(gptSystemPromptInput).setLabel('システムプロンプト (空欄でリセット)').setPlaceholder('例: あなたは〇〇軍団の優秀なアシスタントです。').setStyle(TextInputStyle.Paragraph).setValue(gptConfig.systemPrompt || '').setRequired(false)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId(gptTemperatureInput).setLabel('Temperature (0.0-2.0, 空欄でリセット)').setPlaceholder('例: 0.7 (応答の多様性。デフォルトは1.0)').setStyle(TextInputStyle.Short).setValue(gptConfig.temperature !== undefined ? String(gptConfig.temperature) : '').setRequired(false)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId(gptModelInput).setLabel('使用モデル (空欄でリセット)').setPlaceholder('例: gpt-4-turbo (デフォルトは gpt-4-turbo)').setStyle(TextInputStyle.Short).setValue(gptConfig.model || '').setRequired(false)
                )
            );

            await interaction.showModal(modal);

        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ChatGPT基本設定モーダル表示' });
        }
    }
};