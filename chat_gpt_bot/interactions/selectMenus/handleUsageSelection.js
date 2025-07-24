// e:/共有フォルダ/legion/chat_gpt_bot/interactions/selectMenus/handleUsageSelection.js
const { isChatGptAdmin } = require('../../../permissionManager');
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

            // Re-check admin permission
            if (!(await isChatGptAdmin(interaction))) {
                const noPermissionEmbed = createErrorEmbed(
                    '❌ 権限がありません',
                    'この操作は管理者のみ実行可能です。'
                );
                return await interaction.editReply({ embeds: [noPermissionEmbed], components: [] });
            }

            const guildId = interaction.guildId;
            const config = await getChatGPTConfig(guildId);

            if (!config.apiKey) {
                const noApiKeyEmbed = createErrorEmbed(
                    'APIキー未設定',
                    'ChatGPTのAPIキーが未設定のため、使用量を取得できません。'
                );
                return await interaction.editReply({ embeds: [noApiKeyEmbed], components: [] });
            }

            const usageResult = await getOpenAIUsage(config.apiKey);

            if (usageResult.error) {
                const errorEmbed = createErrorEmbed(
                    '使用量取得エラー',
                    usageResult.message || '不明なエラーが発生しました。'
                );
                return await interaction.editReply({ embeds: [errorEmbed], components: [] });
            }

            const usageEmbed = createSuccessEmbed(
                '💸 OpenAI 今月の使用量',
                `現在の使用量は **$${usageResult.usage} USD** です。\n\n※この値は OpenAI ダッシュボードから取得された最新データです。`
            );

            await interaction.editReply({ embeds: [usageEmbed], components: [] });
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ChatGPT使用量表示' });
        }
    }
};