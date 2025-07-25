// e:/共有フォルダ/legion/chat_gpt_bot/interactions/buttons/chatgpt_panel_open_config_modal.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { checkChatGptAdmin } = require('../../../manager/permissionManager'); // 同期的な権限チェック関数
const { getLegionConfig } = require('../../../manager/configDataManager'); // ボット全体のコンフィグゲッター
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { gptConfigModal, gptApiKeyInput, gptSystemPromptInput, gptTemperatureInput, gptModelInput } = require('../../utils/customIds');

module.exports = {
    customId: 'chatgpt_panel_open_config_modal',
    async handle(interaction) {
        try {
            // GCSへのアクセスを1回にまとめることで、タイムアウトのリスクを軽減します
            const legionConfig = await getLegionConfig(interaction.guildId);

            // 権限チェックは取得したコンフィグを渡して同期的に行います
            if (!checkChatGptAdmin(interaction.member, legionConfig)) {
                return interaction.reply({ content: '🚫 この操作を実行する権限がありません。', flags: MessageFlags.Ephemeral });
            }

            // ChatGPT用の設定をlegionConfigから抽出します
            const gptConfig = legionConfig.chatGptConfig || {}; // chatGptConfigが存在しない場合も考慮

            const modal = new ModalBuilder()
                .setCustomId(gptConfigModal)
                .setTitle('ChatGPT 設定の編集');

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(gptApiKeyInput)
                        .setLabel('OpenAI APIキー (sk-...)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('APIキーはGCSに保存されます。取扱いには注意してください。')
                        .setValue(gptConfig.apiKey || '')
                        .setRequired(true)
                ),
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