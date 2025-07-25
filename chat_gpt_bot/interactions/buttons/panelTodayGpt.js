// legion/chat_gpt_bot/interactions/buttons/panelTodayGpt.js
const { EmbedBuilder, MessageFlags } = require('discord.js');
const { getChatGPTConfig } = require('../../utils/configManager');
const { generateOneOffReply } = require('../../manager/gptManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
    customId: 'chatgpt_panel_today_gpt',
    async handle(interaction) {
        try {
            // まずはEphemeralで応答し、処理中であることをユーザーに伝えます
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const config = await getChatGPTConfig(interaction.guildId);
            if (!config.apiKey) {
                return interaction.editReply({ content: '⚠️ OpenAI APIキーが設定されていません。\n「基本設定を編集」から設定してください。' });
            }
            if (!config.today_gpt_channel_id) {
                return interaction.editReply({
                    content: '⚠️ 「今日のChatGPT」を投稿するチャンネルが設定されていません。\n「「今日のGPT」CH設定」から設定してください。'
                });
            }

            const targetChannel = await interaction.client.channels.fetch(config.today_gpt_channel_id).catch(() => null);
            if (!targetChannel || !targetChannel.isTextBased()) {
                return interaction.editReply({ content: '⚠️ 「今日のChatGPT」を投稿するチャンネルが見つからないか、テキストチャンネルではありません。設定を確認してください。' });
            }

            // 処理開始をユーザーに通知
            await interaction.editReply({ content: `✅ <#${targetChannel.id}> に「今日のChatGPT」を生成しています...` });

            const prompt = '日本の今日の天気、主要なニュース、そして面白い豆知識を、それぞれ項目を分けて簡潔に教えてください。';
            const reply = await generateOneOffReply(interaction.guildId, prompt);

            if (!reply) {
                await targetChannel.send({ content: '🤖 情報の生成に失敗しました。' }).catch();
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('☀️ 今日のお知らせ')
                .setDescription(reply)
                .setColor(0x10A37F) // OpenAI Green
                .setTimestamp()
                .setFooter({ text: 'Powered by ChatGPT' });

            // 設定されたチャンネルに公開メッセージとして投稿
            await targetChannel.send({ embeds: [embed] });

        } catch (error) {
            // エラーはボタンを押した本人にのみ表示
            await handleInteractionError({ interaction, error, context: '今日のChatGPTパネルボタン' });
        }
    }
};