// e:/共有フォルダ/legion/chat_gpt_bot/utils/chatHandler.js

const { getChatGPTConfig } = require('./configManager');

/**
 * Processes an incoming message to potentially generate a ChatGPT response.
 * @param {import('discord.js').Message} message The message object from the event.
 * @param {import('discord.js').Client} client The bot client instance.
 */
async function handleGptChat(message, client) {
    try {
        // 1. Basic checks: ignore bots and DMs
        if (message.author.bot || !message.guild) {
            return;
        }

        // 2. Get config and check if the feature is enabled for this channel
        const config = await getChatGPTConfig(message.guild.id);
        if (!config.allowedChannels || !config.allowedChannels.includes(message.channel.id)) {
            return;
        }

        // 3. Check for trigger condition (mention or reply to the bot)
        const isMentioned = message.mentions.has(client.user.id);
        const isReplyToBot = message.reference && (await message.fetchReference()).author.id === client.user.id;

        if (!isMentioned && !isReplyToBot) {
            return;
        }

        // 4. Check for API Key
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.warn(`[ChatGPT] OpenAI API key is not set in the server's environment variables. Ignoring message for guild ${message.guild.id}.`);
            return;
        }

        await message.channel.sendTyping();

        // 5. Build conversation history
        const conversation = [];
        if (config.systemPrompt) {
            conversation.push({ role: 'system', content: config.systemPrompt });
        }

        // Fetch up to 10 previous messages and the current one to build context
        const messageHistory = await message.channel.messages.fetch({ limit: 10, before: message.id });
        messageHistory.set(message.id, message);

        // Follow the reply chain to get better context
        let currentMsg = message;
        while (currentMsg.reference) {
            try {
                const referencedMsg = await currentMsg.fetchReference();
                if (!messageHistory.has(referencedMsg.id)) {
                    messageHistory.set(referencedMsg.id, referencedMsg);
                }
                currentMsg = referencedMsg;
            } catch {
                break; // Stop if reference is deleted or inaccessible
            }
        }

        const sortedMessages = [...messageHistory.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);

        for (const msg of sortedMessages) {
            const content = msg.content.replace(/<@!?\d+>/g, '').trim();
            if (!content) continue;

            if (msg.author.id === client.user.id) {
                conversation.push({ role: 'assistant', content });
            } else if (!msg.author.bot) {
                conversation.push({ role: 'user', name: msg.author.username.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 64) || 'user', content });
            }
        }

        // 6. Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: config.model || 'gpt-4-turbo',
                messages: conversation,
                temperature: config.temperature,
                user: message.author.id,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: { message: 'Unknown API error' } }));
            await message.reply({ content: `🤖 APIエラーが発生しました: ${errorData.error.message}` });
            return;
        }

        const result = await response.json();
        const replyText = result.choices[0]?.message?.content?.trim();

        // 7. Send reply
        if (replyText) {
            // Split message if it's too long for Discord
            for (let i = 0; i < replyText.length; i += 2000) {
                const chunk = replyText.substring(i, i + 2000);
                if (i === 0) {
                    await message.reply({ content: chunk, allowedMentions: { repliedUser: false } });
                } else {
                    await message.channel.send(chunk);
                }
            }
        }
    } catch (error) {
        console.error(`[ChatGPT] Error handling message ${message.id} in guild ${message.guild?.id}:`, error);
    }
}

module.exports = { handleGptChat };