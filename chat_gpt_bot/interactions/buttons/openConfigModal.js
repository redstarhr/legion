// chat_gpt/interactions/buttons/openConfigModal.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { getConfig } = require('../../manager/chatGptManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
    customId: 'chatgpt_open_config_modal',
    async handle(interaction) {
        try {
            const currentConfig = await getConfig(interaction.guildId);

            const modal = new ModalBuilder()
                .setCustomId('chatgpt_submit_config')
                .setTitle('ChatGPT 設定');

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
                .setValue(currentConfig.persona)
                .setPlaceholder('例: 関西弁で話す陽気な友人')
                .setRequired(true);

            const areaInput = new TextInputBuilder()
                .setCustomId('area')
                .setLabel('得意な地域・分野')
                .setStyle(TextInputStyle.Short)
                .setValue(currentConfig.area)
                .setPlaceholder('例: 大阪')
                .setRequired(true);

            const maxTokensInput = new TextInputBuilder()
                .setCustomId('maxTokens')
                .setLabel('最大応答文字数 (トークン数)')
                .setStyle(TextInputStyle.Short)
                .setValue(String(currentConfig.maxTokens))
                .setPlaceholder('例: 300 (数字のみ)')
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(apiKeyInput),
                new ActionRowBuilder().addComponents(personaInput),
                new ActionRowBuilder().addComponents(areaInput),
                new ActionRowBuilder().addComponents(maxTokensInput)
            );

            await interaction.showModal(modal);
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ChatGPT設定モーダル表示' });
        }
    }
};