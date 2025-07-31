// chat_gpt_bot/interactions/modals/submitGptConfig.js

const { MessageFlags } = require('discord.js');
const { isChatGptAdmin } = require('../../../manager/permissionManager');
const { setChatGPTConfig } = require('../../utils/configManager');
const { gptConfigModal, gptApiKeyInput, gptSystemPromptInput, gptTemperatureInput, gptModelInput } = require('../../utils/customIds');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
  customId: gptConfigModal,
  async handle(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      if (!(await isChatGptAdmin(interaction))) {
        return interaction.editReply({ content: '🚫 この操作を実行する権限がありません。' });
      }

      const apiKeyRaw = interaction.fields.getTextInputValue(gptApiKeyInput);
      const apiKey = apiKeyRaw?.trim();

      // 入力値取得＆trim
      const systemPromptRaw = interaction.fields.getTextInputValue(gptSystemPromptInput)?.trim();
      const temperatureRaw = interaction.fields.getTextInputValue(gptTemperatureInput)?.trim();
      const modelRaw = interaction.fields.getTextInputValue(gptModelInput)?.trim();

      if (!apiKey || !apiKey.startsWith('sk-') || apiKey.length < 20) {
        return interaction.editReply({
          content: '⚠️ APIキーの形式が正しくありません。`sk-`で始まる有効なキーを入力してください。',
        });
      }

      // 空文字はnullに統一
      const systemPrompt = systemPromptRaw === '' ? null : systemPromptRaw;
      const model = modelRaw === '' ? null : modelRaw;

      // 更新オブジェクトを作成
      const updates = { apiKey, systemPrompt, model };

      // temperatureの検証とセット
      if (temperatureRaw === '' || temperatureRaw === undefined || temperatureRaw === null) {
        // 空欄や未入力はリセット扱い
        updates.temperature = null;
      } else {
        const temperature = parseFloat(temperatureRaw);
        if (isNaN(temperature) || temperature < 0.0 || temperature > 2.0) {
          return interaction.editReply({
            content: '⚠️ 「Temperature」には0.0〜2.0の数値を入力してください（例: 0.7）。',
          });
        }
        updates.temperature = temperature;
      }

      // 設定保存
      await setChatGPTConfig(interaction.guildId, updates);

      await interaction.editReply({
        content: '✅ ChatGPTの基本設定を保存しました。\n再度 `/legion_chatgpt_パネル設置` コマンドを実行して設定を確認してください。',
      });

    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'ChatGPT基本設定保存' });
    }
  },
};
