const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} = require('discord.js');
const { checkChatGptAdmin } = require('../../../manager/permissionManager');
const { getLegionConfig } = require('../../../manager/configDataManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { gptConfigModal, gptApiKeyInput, gptSystemPromptInput, gptTemperatureInput, gptModelInput } = require('../../utils/customIds');

module.exports = {
  customId: 'chatgpt_panel_open_config_modal',

  async handle(interaction) {
    try {
      // 1回のGCSアクセスでコンフィグをまとめて取得
      const legionConfig = await getLegionConfig(interaction.guildId);

      // 権限チェックは非同期対応で統一（必要ならawait外す）
      if (!(await checkChatGptAdmin(interaction.member, legionConfig))) {
        return interaction.reply({ content: '🚫 この操作を実行する権限がありません。', flags: MessageFlags.Ephemeral });
      }

      const gptConfig = legionConfig.chatGptConfig || {};

      const modal = new ModalBuilder()
        .setCustomId(gptConfigModal)
        .setTitle('ChatGPT 設定の編集');

      const apiKeyInput = new TextInputBuilder()
        .setCustomId(gptApiKeyInput)
        .setLabel('OpenAI APIキー (sk-...)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('APIキーはGCSに保存されます。取扱いには注意してください。')
        .setValue(gptConfig.apiKey || '')
        .setRequired(true);

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
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('例: gpt-4-turbo (デフォルトは gpt-4-turbo)')
        .setValue(gptConfig.model || '')
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(apiKeyInput),
        new ActionRowBuilder().addComponents(systemPromptInput),
        new ActionRowBuilder().addComponents(temperatureInput),
        new ActionRowBuilder().addComponents(modelInput)
      );

      await interaction.showModal(modal);

    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'ChatGPT基本設定モーダル表示' });
    }
  },
};
