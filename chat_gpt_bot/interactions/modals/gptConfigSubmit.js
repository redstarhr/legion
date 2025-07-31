'use strict';

const { checkAdminAndReply } = require('../../utils/permissionChecker');
const { setChatGPTConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { gptConfigModal, gptApiKeyInput, gptSystemPromptInput, gptTemperatureInput, gptModelInput } = require('../../utils/customIds');

module.exports = {
  customId: gptConfigModal,

  async handle(interaction) {
    try {
      if (!(await checkAdminAndReply(interaction))) {
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      const apiKey = interaction.fields.getTextInputValue(gptApiKeyInput).trim();
      const systemPrompt = interaction.fields.getTextInputValue(gptSystemPromptInput).trim();
      const temperatureStr = interaction.fields.getTextInputValue(gptTemperatureInput).trim();
      const model = interaction.fields.getTextInputValue(gptModelInput).trim();

      const updates = {};
      let validationError = null;

      // APIキー: 空文字列はnullとして扱い、設定を削除する
      if (apiKey && (!apiKey.startsWith('sk-') || apiKey.length < 20)) {
        validationError = 'APIキーの形式が正しくありません。`sk-`で始まる有効なキーを入力してください。';
      } else {
        updates.apiKey = apiKey || null;
      }
      // システムプロンプト: 空文字列はnullとして扱い、デフォルトにリセットする
      updates.systemPrompt = systemPrompt || null;

      // モデル: 空文字列はnullとして扱い、デフォルトにリセットする
      updates.model = model || null;

      // Temperatureのバリデーション
      if (temperatureStr === '') {
        updates.temperature = null; // 空文字列はnullとして扱い、デフォルトにリセット
      } else {
        const temperature = parseFloat(temperatureStr);
        if (isNaN(temperature) || temperature < 0.0 || temperature > 2.0) {
          validationError = 'Temperatureは 0.0 から 2.0 の間の数値でなければなりません。';
        } else {
          updates.temperature = temperature;
        }
      }

      if (validationError) {
        return interaction.editReply({
          content: `❌ 設定の保存に失敗しました: ${validationError}`,
        });
      }

      await setChatGPTConfig(interaction.guildId, updates);

      await interaction.editReply({
        content: '✅ ChatGPTの設定を更新しました。\n再度 `/legion_chatgpt_パネル設置` コマンドを実行して、パネルを更新してください。',
      });

    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'ChatGPT基本設定保存' });
    }
  },
};