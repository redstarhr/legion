// legion/chat_gpt_bot/interactions/buttons/panelTodayGpt.js
const { EmbedBuilder, MessageFlags } = require('discord.js');
const { getConfig, generateReply } = require('../../manager/chatGptManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
    customId: 'chatgpt_panel_today_gpt',
    async handle(interaction) {
        try {
            // まずはEphemeralで応答し、処理中であることをユーザーに伝えます
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const config = await getConfig(interaction.guildId);
            if (!config.today_gpt_channel_id) {
                return interaction.editReply({
                    content: '⚠️ 「今日のChatGPT」を投稿するチャンネルが設定されていません。\n管理者に依頼して `/legion_chatgpt_設定` から設定してください。',
                });
            }

            const targetChannel = await interaction.client.channels.fetch(config.today_gpt_channel_id).catch(() => null);
            if (!targetChannel || !targetChannel.isTextBased()) {
                return interaction.editReply({
                    content: '⚠️ 「今日のChatGPT」を投稿するチャンネルが見つからないか、テキストチャンネルではありません。設定を確認してください。',
                });
            }

            // 処理開始をユーザーに通知
            await interaction.editReply({ content: `✅ <#${targetChannel.id}> に「今日のChatGPT」を生成しています...` });

            const prompt = '日本の今日の天気、主要なニュース、そして面白い豆知識を、それぞれ項目を分けて簡潔に教えてください。';
            const reply = await generateReply(interaction.guildId, prompt);

            const embed = new EmbedBuilder()
                .setTitle('☀️ 今日のお知らせ')
                .setDescription(reply)
                .setColor(0x2ecc71) // パネルと同じ色
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