// chat_gpt_bot/interactions/selectMenus/handleUsageSelection.js
const { checkAdminAndReply } = require('../../utils/permissionChecker');
const { getOpenAIUsage } = require('../../utils/star_chat_gpt_usage/openaiUsage');
const { getChatGPTConfig } = require('../../utils/configManager');
const {
  createErrorEmbed,
  createSuccessEmbed,
} = require('../../utils/embedHelper');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
  customId: 'chatgpt_select_usage_type',

  async handle(interaction) {
    try {
      await interaction.deferUpdate();

      if (!(await checkAdminAndReply(interaction))) return;

      const { apiKey } = await getChatGPTConfig(interaction.guildId);

      if (!apiKey || apiKey.trim() === '') {
        return interaction.editReply({
          embeds: [
            createErrorEmbed(
              '⚠️ APIキーが未設定です',
              'ChatGPT APIキーが設定されていないため、使用量の取得ができません。'
            ),
          ],
          components: [],
        });
      }

      const usageResult = await getOpenAIUsage(apiKey);

      if (usageResult.error) {
        return interaction.editReply({
          embeds: [
            createErrorEmbed(
              '使用量の取得に失敗しました',
              usageResult.message || 'OpenAI APIからの情報取得時にエラーが発生しました。'
            ),
          ],
          components: [],
        });
      }

      return interaction.editReply({
        embeds: [
          createSuccessEmbed(
            '💸 OpenAI 今月の使用量',
            `現在の使用量は **$${usageResult.usage} USD** です。\n\n※この数値は OpenAI ダッシュボードのデータを元にしています。`
          ),
        ],
        components: [],
      });
    } catch (error) {
      await handleInteractionError({
        interaction,
        error,
        context: 'ChatGPT使用量表示',
      });
    }
  },
};
