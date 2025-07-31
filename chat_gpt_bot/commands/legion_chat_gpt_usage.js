// chat_gpt_bot/commands/legion_chat_gpt_usage.js

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { isChatGptAdmin } = require('../../manager/permissionManager');
const { getChatGPTConfig } = require('../utils/configManager');
const { getOpenAiUsage } = require('../utils/star_chat_gpt_usage/openaiUsage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('legion_chatgpt_使用率')
    .setDescription('今月のAPI使用量と現在の設定を表示します。(管理者のみ)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    // isChatGptAdmin内でエラーが起きる可能性があるため、try-catchで囲む
    try {
      if (!(await isChatGptAdmin(interaction))) {
        return interaction.reply({
          content: '❌ このコマンドを実行する権限がありません。',
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true }); // 先に応答を遅延させる

      const gptConfig = await getChatGPTConfig(interaction.guildId);
      const apiKey = gptConfig.apiKey;

      const now = new Date();
      const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD

      const embed = new EmbedBuilder()
        .setTitle(`🤖 ChatGPT 状況確認 (${now.getFullYear()}年${now.getMonth() + 1}月)`)
        .setColor(0x10A37F)
        .setDescription(
          '今月のAPI使用量 (USD) と現在のBot設定です。\n※使用量データの反映には数時間かかることがあります。'
        )
        .setTimestamp()
        .setFooter({
          text: 'Powered by OpenAI ・ JST時間基準',
          iconURL: 'https://openai.com/favicon.ico',
        });

      // API使用量取得
      if (apiKey) {
        try {
          const usageData = await getOpenAiUsage(apiKey, dateString); // apiKeyを渡すように修正
          const totalUsageCents = usageData.total_usage; // API returns usage in cents

          if (totalUsageCents !== undefined && totalUsageCents !== null) {
            embed.addFields({
              name: '💰 合計使用額',
              value: `**$${(totalUsageCents / 100).toFixed(4)}**`,
              inline: true,
            });
          }

          // モデル別使用額の集計
          const modelUsage = {};
          if (Array.isArray(usageData.daily_costs)) {
            usageData.daily_costs.forEach(daily => {
              daily.line_items?.forEach(item => {
                modelUsage[item.name] = (modelUsage[item.name] || 0) + item.cost;
              });
            });
          }

          if (Object.keys(modelUsage).length > 0) {
            const breakdown = Object.entries(modelUsage)
              .sort(([, a], [, b]) => b - a)
              .map(([name, cost]) => `**${name}**: $${(cost / 100).toFixed(4)}`)
              .join('\n');
            embed.addFields({ name: '📊 モデル別内訳', value: breakdown, inline: true });
          }
        } catch (apiError) {
          embed.addFields({
            name: '⚠️ API使用量取得失敗',
            value: `\`\`\`${apiError.message}\`\`\``,
            inline: false,
          });
        }
      } else {
        embed.addFields({
          name: '⚠️ APIキー未設定',
          value: '使用量を取得するにはAPIキーを設定してください。',
          inline: false,
        });
      }

      // 設定情報
      const apiKeyStatus = apiKey
        ? `✅ 設定済み (\`${apiKey.slice(0, 5)}...${apiKey.slice(-4)}\`)`
        : '❌ 未設定';
      const systemPrompt = gptConfig.systemPrompt || '未設定';
      const temperature =
        gptConfig.temperature !== null && gptConfig.temperature !== undefined
          ? String(gptConfig.temperature)
          : 'デフォルト (1.0)';
      const model = gptConfig.model || 'デフォルト (gpt-4o)';

      embed.addFields(
        { name: '\u200B', value: '**⚙️ 現在の設定**' },
        { name: '🧠 システムプロンプト', value: `\`\`\`${systemPrompt.substring(0, 1000)}\`\`\``, inline: false },
        { name: '🌡️ Temperature', value: `\`${temperature}\``, inline: true },
        { name: '🤖 モデル', value: `\`${model}\``, inline: true },
        { name: '🔑 APIキー', value: apiKeyStatus, inline: false }
      );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      // deferReplyされている可能性があるので、editReplyでエラーを返す
      console.error('[ChatGPT状況確認] Error:', error);
      await interaction.editReply({ content: '❌ コマンドの実行中にエラーが発生しました。' }).catch(() => {});
    }
  },
};
