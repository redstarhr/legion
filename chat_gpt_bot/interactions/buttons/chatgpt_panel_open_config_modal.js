// chat_gpt_bot/interactions/buttons/chatgpt_panel_open_config_modal.js

const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');
const { checkAdminAndReply } = require('../../utils/permissionChecker');
const { getChatGPTConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { gptConfigModal, gptApiKeyInput, gptSystemPromptInput, gptTemperatureInput, gptModelInput, gptMaxTokensInput } = require('../../utils/customIds');

module.exports = {
  customId: 'chatgpt_panel_open_config_modal',

  async handle(interaction) {
    try {
      if (!(await checkAdminAndReply(interaction))) {
        return;
      }

      const gptConfig = await getChatGPTConfig(interaction.guildId);

      const modal = new ModalBuilder()
        .setCustomId(gptConfigModal)
        .setTitle('ChatGPT 設定の編集');

      const apiKeyInput = new TextInputBuilder()
        .setCustomId(gptApiKeyInput)
        .setLabel('OpenAI APIキー (sk-...) (空欄で削除)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('APIキーは暗号化されGCSに保存されます。')
        .setValue(gptConfig.apiKey || '')
        .setRequired(false);

      const systemPromptInput = new TextInputBuilder()
        .setCustomId(gptSystemPromptInput)
        .setLabel('システムプロンプト (空欄でリセット)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('例: あなたは〇〇軍団の優秀なアシスタントです。')
        .setValue(gptConfig.systemPrompt || '')
        .setRequired(false);

      const temperatureInput = new TextInputBuilder()
        .setCustomId(gptTemperatureInput)
        .setLabel('Temperature (0.0-2.0, 空欄でリセット)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('例: 0.7 (応答の多様性。デフォルトは1.0)')
        .setValue(gptConfig.temperature !== undefined ? String(gptConfig.temperature) : '')
        .setRequired(false);

      const modelInput = new TextInputBuilder()
        .setCustomId(gptModelInput)
        .setLabel('使用モデル (空欄でリセット)')
        .setStyle(TextInputStyle.Short) // モデルのデフォルト値を最新に
        .setPlaceholder('例: gpt-4o (デフォルトは gpt-4o)')
        .setValue(gptConfig.model || '')
        .setRequired(false);

      const maxTokensInput = new TextInputBuilder()
        .setCustomId(gptMaxTokensInput)
        .setLabel('最大応答文字数 (空欄でリセット)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('例: 1500 (デフォルトはAPIの最大値)')
        .setValue(gptConfig.maxTokens !== undefined ? String(gptConfig.maxTokens) : '')
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(apiKeyInput),
        new ActionRowBuilder().addComponents(systemPromptInput),
        new ActionRowBuilder().addComponents(temperatureInput),
        new ActionRowBuilder().addComponents(modelInput),
        new ActionRowBuilder().addComponents(maxTokensInput)
      );

      await interaction.showModal(modal);

    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'ChatGPT基本設定モーダル表示' });
    }
  },
};
