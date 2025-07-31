'use strict';

const { setChatGPTConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const {
  gptConfigModal,
  gptApiKeyInput,
  gptSystemPromptInput,
  gptTemperatureInput,
  gptModelInput,
  gptMaxTokensInput,
} = require('../../utils/customIds');

module.exports = {
  customId: gptConfigModal,

  async handle(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const apiKey = interaction.fields.getTextInputValue(gptApiKeyInput) || null;
      const systemPrompt = interaction.fields.getTextInputValue(gptSystemPromptInput) || null;
      const temperatureStr = interaction.fields.getTextInputValue(gptTemperatureInput);
      const model = interaction.fields.getTextInputValue(gptModelInput) || null;
      const maxTokensStr = interaction.fields.getTextInputValue(gptMaxTokensInput);

      const updates = {
        apiKey,
        systemPrompt,
        model,
      };

      // Temperatureのバリデーション
      if (temperatureStr) {
        const temperature = parseFloat(temperatureStr);
        if (isNaN(temperature) || temperature < 0 || temperature > 2) {
          return interaction.editReply({ content: '❌ Temperatureは0.0から2.0の間の数値で入力してください。' });
        }
        updates.temperature = temperature;
      } else {
        updates.temperature = null; // 空欄の場合はリセット
      }

      // Max Tokensのバリデーション
      if (maxTokensStr) {
        const maxTokens = parseInt(maxTokensStr, 10);
        if (isNaN(maxTokens) || maxTokens <= 0) {
          return interaction.editReply({ content: '❌ 最大応答文字数は正の整数で入力してください。' });
        }
        updates.maxTokens = maxTokens;
      } else {
        updates.maxTokens = null; // 空欄の場合はリセット
      }

      await setChatGPTConfig(interaction.guildId, updates);

      await interaction.editReply({ content: '✅ ChatGPTの基本設定を更新しました。' });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'ChatGPT基本設定モーダル処理' });
    }
  },
};