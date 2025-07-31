'use strict';

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { isChatGptAdmin } = require('../../../manager/permissionManager');
const { getChatGPTConfig } = require('../../utils/configManager');
// gptManager.js から、実際にGPT APIを呼び出す関数をインポートします。
// 過去のログから `generateOneOffReply` という関数名だと推測されます。
const { generateOneOffReply } = require('../../manager/gptManager');

/**
 * GPTからの応答テキストをセクションに分割する
 * @param {string} text - GPTからの応答テキスト
 * @returns {{weather?: string, news?: string, trivia?: string} | null} パースされたセクション、または失敗時にnull
 */
function parseGptResponse(text) {
  const sections = {};
  // 各セクションを見出しで検索し、次の見出しまたは文字列の終わりまでを内容として抽出します。
  const weatherMatch = text.match(/【今日の天気】\s*([\s\S]*?)(?=\n【|$(?![\r\n]))/);
  const newsMatch = text.match(/【主要なニュース】\s*([\s\S]*?)(?=\n【|$(?![\r\n]))/);
  const triviaMatch = text.match(/【面白い豆知識】\s*([\s\S]*?)(?=\n【|$(?![\r\n]))/);

  if (weatherMatch) sections.weather = weatherMatch[1].trim();
  if (newsMatch) sections.news = newsMatch[1].trim();
  if (triviaMatch) sections.trivia = triviaMatch[1].trim();

  return Object.keys(sections).length > 0 ? sections : null;
}

module.exports = {
  // legion_chat_gpt_setti.js で定義されたボタンのIDと一致させます
  customId: 'chatgpt_panel_today_gpt',

  async handle(interaction, client) {
    try {
      // 管理者権限をチェック
      if (!(await isChatGptAdmin(interaction))) {
        return interaction.reply({
          content: '❌ この操作を実行する権限がありません。',
          ephemeral: true,
        });
      }

      // 再生成（ボット自身のメッセージのボタン）か、初回生成（パネルのボタン）かを判定
      const isRegeneration = interaction.message.author.id === client.user.id;

      if (isRegeneration) {
        // ボタンを押した元のメッセージを更新する準備をします
        await interaction.deferUpdate();
      } else {
        // パネル操作者への一時的な応答を保留します
        await interaction.deferReply({ ephemeral: true });
      }

      const gptConfig = await getChatGPTConfig(interaction.guildId);
      const channelId = gptConfig.today_gpt_channel_id;

      if (!channelId) {
        return interaction.editReply({
          content: '「今日のChatGPT」を投稿するチャンネルが設定されていません。`/chatgpt_設定` コマンドから設定してください。',
        });
      }

      const targetChannel = await interaction.guild.channels.fetch(channelId).catch(() => null);
      if (!targetChannel || !targetChannel.isTextBased()) {
        return interaction.editReply({
          content: `投稿先のチャンネル(ID: ${channelId})が見つからないか、テキストチャンネルではありません。`,
        });
      }

      if (!isRegeneration) {
        await interaction.editReply({ content: `⏳ ${targetChannel} に「今日のChatGPT」を生成しています...` });
      }

      // gptManagerを呼び出して返信を生成します
      const replyContent = await generateOneOffReply(interaction.guild.id, 'today_gpt');

      if (!replyContent) {
        return interaction.followUp({ content: '❌ ChatGPTからの応答がありませんでした。APIキーや設定を確認してください。', ephemeral: true });
      }

      // 再生成ボタンを作成します。
      const regenerateButton = new ButtonBuilder()
        .setCustomId(this.customId) // 自分自身のcustomIdを再利用して、同じ処理を呼び出せるようにします
        .setLabel('再生成する')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🔄');

      const row = new ActionRowBuilder().addComponents(regenerateButton);

      // GPTの応答をパースしてEmbedを作成
      const parsedData = parseGptResponse(replyContent);
      const messagePayload = { components: [row] };

      if (parsedData) {
        const embed = new EmbedBuilder()
          .setTitle('☀️ 今日のお知らせ')
          .setColor(0x5865F2) // Discord Blue
          .setTimestamp()
          .setFooter({ text: 'Powered by ChatGPT' });

        if (parsedData.weather) embed.addFields({ name: '【今日の天気】', value: parsedData.weather });
        if (parsedData.news) embed.addFields({ name: '【主要なニュース】', value: parsedData.news });
        if (parsedData.trivia) embed.addFields({ name: '【面白い豆知識】', value: parsedData.trivia });

        messagePayload.embeds = [embed];
      } else {
        // パースに失敗した場合は、元のテキストをそのまま送信
        messagePayload.content = replyContent;
      }

      if (isRegeneration) {
        // 既存のメッセージを編集して更新します
        await interaction.message.edit(messagePayload);
        await interaction.followUp({ content: '✅ メッセージを再生成しました。', ephemeral: true });
      } else {
        // 新しいメッセージとしてチャンネルに投稿します
        await targetChannel.send(messagePayload);
        await interaction.editReply({ content: `✅ ${targetChannel} に「今日のChatGPT」を投稿しました。` });
      }

    } catch (error) {
      await handleInteractionError({ interaction, error, context: '今日のChatGPT生成ボタン' });
    }
  },
};