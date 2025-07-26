const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { handleInteractionError } = require('../../utils/interactionErrorLogger');
const { isChatGptAdmin } = require('../../manager/permissionManager');
const { getChatGPTConfig } = require('../utils/configManager');

/** YYYY-MM-DD フォーマット関数 */
const formatDate = (date) => date.toISOString().split('T')[0];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('legion_chatgpt_使用率')
    .setDescription('今月のAPI使用量と現在の設定を表示します。(管理者のみ)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      if (!(await isChatGptAdmin(interaction))) {
        return interaction.reply({
          content: '❌ このコマンドを実行する権限がありません。',
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });

      const gptConfig = await getChatGPTConfig(interaction.guildId);
      const apiKey = gptConfig.apiKey;

      if (!apiKey) {
        return interaction.editReply({
          content: '❌ OpenAI APIキーが設定されていません。\n`/legion_chatgpt_パネル設置`の「基本設定を編集」から設定してください。',
        });
      }

      // 今月の期間を算出
      const now = new Date();
      const startDateStr = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
      const endDateStr = formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 1));

      const url = `https://api.openai.com/v1/dashboard/billing/usage?start_date=${startDateStr}&end_date=${endDateStr}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: '不明なAPIエラー' } }));
        console.error('OpenAI API Error:', errorData);
        return interaction.editReply({
          content: `❌ OpenAI APIから使用量を取得できませんでした。\n**理由:** ${errorData.error.message}\nAPIキーが正しいか確認してください。`,
        });
      }

      const usageData = await response.json();
      const totalUsageDollars = (usageData.total_usage || 0) / 100;

      const embed = new EmbedBuilder()
        .setTitle(`🤖 ChatGPT 状況確認 (${now.getFullYear()}年${now.getMonth() + 1}月)`)
        .setColor(0x10A37F)
        .setDescription('今月のAPI使用量 (USD) と現在のBot設定です。\n※使用量データの反映には数時間かかることがあります。')
        .setTimestamp()
        .setFooter({
          text: 'Powered by OpenAI ・ JST時間基準',
          iconURL: 'https://openai.com/favicon.ico',
        });

      // モデル別使用額の内訳を計算
      embed.addFields({
        name: '💰 合計使用額',
        value: `**$${totalUsageDollars.toFixed(4)}**`,
        inline: true,
      });

      const modelUsage = {};
      usageData.daily_costs?.forEach(daily => {
        daily.line_items?.forEach(item => {
          modelUsage[item.name] = (modelUsage[item.name] || 0) + item.cost;
        });
      });

      if (Object.keys(modelUsage).length > 0) {
        const breakdown = Object.entries(modelUsage)
          .sort(([, a], [, b]) => b - a)
          .map(([name, cost]) => `**${name}**: $${(cost / 100).toFixed(4)}`)
          .join('\n');

        embed.addFields({ name: '📊 モデル別内訳', value: breakdown, inline: true });
      }

      // --- Config Section ---
      const apiKeyStatus = `✅ 設定済み (\`${apiKey.slice(0, 5)}...${apiKey.slice(-4)}\`)`;
      const systemPrompt = gptConfig.systemPrompt || '未設定';
      const temperature = gptConfig.temperature !== null && gptConfig.temperature !== undefined ? String(gptConfig.temperature) : 'デフォルト (1.0)';
      const model = gptConfig.model || 'デフォルト (gpt-4o)';
      const autoChannels = gptConfig.allowedChannels?.length > 0 ? gptConfig.allowedChannels.map(id => `<#${id}>`).join(' ') : '未設定';

      embed.addFields(
        { name: '\u200B', value: '**⚙️ 現在の設定**' }, // Separator and title
        { name: '🧠 システムプロンプト', value: `\`\`\`${systemPrompt.substring(0, 1000)}\`\`\``, inline: false },
        { name: '🌡️ Temperature', value: `\`${temperature}\``, inline: true },
        { name: '🤖 モデル', value: `\`${model}\``, inline: true },
        { name: '🗣️ 自動応答CH', value: autoChannels, inline: false },
        { name: '🔑 APIキー', value: apiKeyStatus, inline: false }
      );

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'ChatGPT状況確認' });
    }
  },
};
