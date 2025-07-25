// e:/共有フォルダ/legion/admin_bot/interactions/modals/submitGptConfig.js
const { isChatGptAdmin } = require('../../../permissionManager');
const { setChatGPTConfig } = require('../../../manager/configDataManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { GPT_SYSTEM_PROMPT_INPUT, GPT_TEMPERATURE_INPUT, GPT_MODEL_INPUT, GPT_CONFIG_MODAL } = require('../../utils/customIds');

module.exports = {
    customId: GPT_CONFIG_MODAL,
    async handle(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            if (!(await isChatGptAdmin(interaction))) {
                return interaction.editReply({ content: '🚫 この操作を実行する権限がありません。' });
            }

            const systemPrompt = interaction.fields.getTextInputValue(GPT_SYSTEM_PROMPT_INPUT) || null;
            const temperatureRaw = interaction.fields.getTextInputValue(GPT_TEMPERATURE_INPUT);
            const model = interaction.fields.getTextInputValue(GPT_MODEL_INPUT) || null;

            const updates = { systemPrompt, model };

            if (temperatureRaw) {
                const temperature = parseFloat(temperatureRaw);
                if (isNaN(temperature) || temperature < 0.0 || temperature > 2.0) {
                    return interaction.editReply({ content: '⚠️ 「Temperature」には0.0から2.0までの数値を入力してください。' });
                }
                updates.temperature = temperature;
            } else {
                updates.temperature = null; // 空欄の場合はリセット
            }

            await setChatGPTConfig(interaction.guildId, updates);

            await interaction.editReply({ content: '✅ ChatGPTの基本設定を保存しました。\n再度 `/legion_admin chatgpt 設定表示` を実行して確認してください。' });

        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ChatGPT基本設定保存' });
        }
    }
};