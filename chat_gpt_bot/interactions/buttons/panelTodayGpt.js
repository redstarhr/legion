// chat_gpt_bot/interactions/buttons/panelTodayGpt.js

const { EmbedBuilder, MessageFlags } = require('discord.js');
const { getChatGPTConfig } = require('../../utils/configManager');
const { generateOneOffReply } = require('../manager/gptManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { isChatGptAdmin } = require('../../../manager/permissionManager');

module.exports = {
  customId: 'chatgpt_panel_today_gpt',
  async handle(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // 権限チェック
      if (!(await isChatGptAdmin(interaction))) {
        return interaction.editReply({
          content: '🚫 この操作を実行する権限がありません。',
        });
      }

      const config = await getChatGPTConfig(interaction.guildId);

      if (!config.apiKey) {
        return await interaction.editReply({
          content: '⚠️ OpenAI APIキーが設定されていません。\n「基本設定を編集」から設定してください。',
        });
      }

      if (!config.today_gpt_channel_id) {
        return await interaction.editReply({
          content: '⚠️ 「今日のChatGPT」を投稿するチャンネルが設定されていません。\n「「今日のGPT」CH設定」から設定してください。',
        });
      }

      // チャンネル取得と検証
      const targetChannel = await interaction.client.channels.fetch(config.today_gpt_channel_id).catch(() => null);
      if (!targetChannel || !targetChannel.isTextBased()) {
        return await interaction.editReply({
          content: '⚠️ 「今日のChatGPT」を投稿するチャンネルが見つからないか、テキストチャンネルではありません。設定を確認してください。',
        });
      }

      // 処理開始通知を更新
      await interaction.editReply({
        content: `✅ <#${targetChannel.id}> に「今日のChatGPT」を生成しています...`,
      });

      // ChatGPTへのプロンプト
      const prompt = '日本の今日の天気、主要なニュース、そして面白い豆知識を、それぞれ項目を分けて簡潔に教えてください。';
      const reply = await generateOneOffReply(interaction.guildId, prompt);

      if (!reply) {
        return await interaction.editReply({
          content: '❌ 情報の生成に失敗しました。OpenAIからの応答が空でした。',
        });
      }

      // 埋め込みメッセージ作成
      const embed = new EmbedBuilder()
        .setTitle('☀️ 今日のお知らせ')
        .setDescription(reply)
        .setColor(0x10A37F) // OpenAI Green
        .setTimestamp()
        .setFooter({ text: 'Powered by ChatGPT' });

      // 設定チャンネルへ投稿
      await targetChannel.send({ embeds: [embed] });

      // 最終的な成功メッセージをユーザーに通知
      await interaction.editReply({
        content: `✅ 「今日のお知らせ」を <#${targetChannel.id}> に投稿しました。`,
      });

    } catch (error) {
      // エラーは操作ユーザーにのみ通知
      await handleInteractionError({
        interaction,
        error,
        context: '今日のChatGPTパネルボタン',
      });
    }
  },
};
