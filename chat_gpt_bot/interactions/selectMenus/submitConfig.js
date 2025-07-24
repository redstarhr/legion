// chat_gpt/interactions/modals/submitConfig.js
const { MessageFlags } = require('discord.js');
const { setConfig } = require('../../../manager/chatGptManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { isChatGptAdmin } = require('../../../permissionManager');
const { logAction } = require('../../../utils/logger');

module.exports = {
    customId: 'chatgpt_submit_config',
    async handle(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            if (!(await isChatGptAdmin(interaction))) {
                return interaction.editReply({ content: '🚫 この操作を実行する権限がありません。' });
            }

            const apiKey = interaction.fields.getTextInputValue('apiKey');
            const persona = interaction.fields.getTextInputValue('persona');
            const area = interaction.fields.getTextInputValue('area');
            const maxTokensRaw = interaction.fields.getTextInputValue('maxTokens');

            // バリデーション
            const maxTokens = parseInt(maxTokensRaw, 10);
            if (!apiKey.startsWith('sk-')) {
                return interaction.editReply({ content: '⚠️ APIキーの形式が正しくありません。`sk-`で始まるキーを入力してください。' });
            }
            if (isNaN(maxTokens) || maxTokens <= 0 || maxTokens > 4096) {
                return interaction.editReply({ content: '⚠️ 最大応答文字数には1から4096までの整数を入力してください。' });
            }

            const newConfig = {
                apiKey,
                persona,
                area,
                maxTokens,
            };

            await setConfig(interaction.guildId, newConfig);

            await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
                title: '⚙️ ChatGPT 設定更新',
                color: '#5865F2', // Discord Blurple
                description: 'ChatGPT連携機能の設定が更新されました。',
                details: {
                    '人格 (Persona)': persona,
                    '地域/分野': area,
                    '最大トークン数': maxTokens,
                }
            });

            await interaction.editReply({ content: '✅ ChatGPTの設定を保存しました。' });

        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ChatGPT設定保存' });
        }
    }
};