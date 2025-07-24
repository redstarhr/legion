// e:/共有フォルダ/legion/chat_gpt_bot/interactions/modals/submitBasicConfig.js
const { MessageFlags } = require('discord.js');
const { isChatGptAdmin } = require('../../../permissionManager');
const { setChatGPTConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { logAction } = require('../../../utils/logger');

module.exports = {
    customId: 'chatgpt_submit_config_basic',
    async handle(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            if (!(await isChatGptAdmin(interaction))) {
                return interaction.editReply({ content: '🚫 この操作を実行する権限がありません。' });
            }

            const apiKey = interaction.fields.getTextInputValue('apiKey');
            const persona = interaction.fields.getTextInputValue('persona');
            const temperatureRaw = interaction.fields.getTextInputValue('temperature') || '0.8';
            const maxTokensRaw = interaction.fields.getTextInputValue('maxTokens');

            // --- Validation ---
            if (!apiKey.startsWith('sk-')) {
                return interaction.editReply({ content: '⚠️ APIキーの形式が正しくありません。`sk-`で始まるキーを入力してください。' });
            }

            const temperature = parseFloat(temperatureRaw);
            if (isNaN(temperature) || temperature < 0.1 || temperature > 1.0) {
                return interaction.editReply({ content: '⚠️ 「応答の曖昧さ」には0.1から1.0までの数値を入力してください。' });
            }

            const maxTokens = parseInt(maxTokensRaw, 10);
            if (isNaN(maxTokens) || maxTokens <= 0 || maxTokens > 4096) {
                return interaction.editReply({ content: '⚠️ 最大応答文字数には1から4096までの整数を入力してください。' });
            }

            const newConfig = { apiKey, persona, temperature, maxTokens };

            await setChatGPTConfig(interaction.guildId, newConfig);

            await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
                title: '⚙️ ChatGPT 基本設定更新',
                color: '#5865F2',
                description: 'ChatGPTの基本設定が更新されました。',
                details: {
                    '人格 (Persona)': persona,
                    '曖昧さ': temperature,
                    '最大トークン数': maxTokens,
                }
            });

            await interaction.editReply({ content: '✅ ChatGPTの基本設定を保存しました。\n再度 `/legion_chatgpt_設定` を実行して確認してください。' });

        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ChatGPT基本設定保存' });
        }
    }
};