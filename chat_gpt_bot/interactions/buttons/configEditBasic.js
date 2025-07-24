// e:/共有フォルダ/legion/chat_gpt_bot/interactions/buttons/configEditBasic.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { isChatGptAdmin } = require('../../../permissionManager');
const { getChatGPTConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
    customId: 'chatgpt_config_edit_basic',
    async handle(interaction) {
        try {
            if (!(await isChatGptAdmin(interaction))) {
                return interaction.reply({ content: '🚫 この操作を実行する権限がありません。', flags: MessageFlags.Ephemeral });
            }

            const currentConfig = await getChatGPTConfig(interaction.guildId);

            const modal = new ModalBuilder()
                .setCustomId('chatgpt_submit_config_basic')
                .setTitle('ChatGPT 基本設定');

            const apiKeyInput = new TextInputBuilder()
                .setCustomId('apiKey')
                .setLabel('OpenAI APIキー')
                .setStyle(TextInputStyle.Short)
                .setValue(currentConfig.apiKey || '')
                .setPlaceholder('sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
                .setRequired(true);

            const personaInput = new TextInputBuilder()
                .setCustomId('persona')
                .setLabel('キャラクター人格 (Persona)')
                .setStyle(TextInputStyle.Paragraph)
                .setValue(currentConfig.persona || '親切なアシスタント')
                .setPlaceholder('例: 関西弁で話す陽気な友人')
                .setRequired(true);

            const temperatureInput = new TextInputBuilder()
                .setCustomId('temperature')
                .setLabel('応答の曖昧さ (0.1 ~ 1.0)')
                .setStyle(TextInputStyle.Short)
                .setValue(String(currentConfig.temperature ?? 0.8))
                .setPlaceholder('例: 0.8 (高いほど多様な応答)')
                .setRequired(false);

            const maxTokensInput = new TextInputBuilder()
                .setCustomId('maxTokens')
                .setLabel('最大応答トークン数')
                .setStyle(TextInputStyle.Short)
                .setValue(String(currentConfig.maxTokens ?? 300))
                .setPlaceholder('例: 300 (数字のみ)')
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(apiKeyInput),
                new ActionRowBuilder().addComponents(personaInput),
                new ActionRowBuilder().addComponents(temperatureInput),
                new ActionRowBuilder().addComponents(maxTokensInput)
            );

            await interaction.showModal(modal);
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ChatGPT基本設定モーダル表示' });
        }
    }
};