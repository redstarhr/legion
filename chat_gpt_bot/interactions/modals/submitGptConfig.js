// legion/chat_gpt_bot/interactions/modals/submitGptConfig.js
const { MessageFlags } = require('discord.js');
const { isChatGptAdmin } = require('../../../permissionManager');
const { setChatGPTConfig } = require('../../utils/configManager');
const { gptConfigModal, gptSystemPromptInput, gptTemperatureInput, gptModelInput } = require('../../utils/customIds');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
    customId: gptConfigModal,
    async handle(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            if (!(await isChatGptAdmin(interaction))) {
                return interaction.editReply({ content: '🚫 この操作を実行する権限がありません。' });
            }

            const systemPrompt = interaction.fields.getTextInputValue(gptSystemPromptInput) || null;
            const temperatureRaw = interaction.fields.getTextInputValue(gptTemperatureInput);
            const model = interaction.fields.getTextInputValue(gptModelInput) || null;

            const updates = { systemPrompt, model };

            if (temperatureRaw) {
                const temperature = parseFloat(temperatureRaw);
                if (isNaN(temperature) || temperature < 0.0 || temperature > 2.0) {
                    return interaction.editReply({ content: '⚠️ 「Temperature」には0.0から2.0までの数値を入力してください。' });
                }
                updates.temperature = temperature;
            } else {
                updates.temperature = null;
            }

            await setChatGPTConfig(interaction.guildId, updates);

            await interaction.editReply({ content: '✅ ChatGPTの基本設定を保存しました。\n再度 `/legion_chatgpt_設定 表示` を実行して確認してください。' });

        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ChatGPT基本設定保存' });
        }
    }
};