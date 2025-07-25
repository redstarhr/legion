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

      // 入力値取得＆trim
      const systemPromptRaw = interaction.fields.getTextInputValue(gptSystemPromptInput)?.trim();
      const temperatureRaw = interaction.fields.getTextInputValue(gptTemperatureInput)?.trim();
      const modelRaw = interaction.fields.getTextInputValue(gptModelInput)?.trim();

      // 空文字はnullに統一
      const systemPrompt = systemPromptRaw === '' ? null : systemPromptRaw;
      const model = modelRaw === '' ? null : modelRaw;

      // 更新オブジェクトを作成
      const updates = { systemPrompt, model };

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
        content: '✅ ChatGPTの基本設定を保存しました。\n再度 `/legion_chatgpt_設定 表示` を実行して確認してください。',
      });

    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'ChatGPT基本設定保存' });
    }
  },
};
