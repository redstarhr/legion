const { getChatGPTConfig } = require('../utils/configManager');

/**
 * Generates a reply from ChatGPT based on a message and its context.
 * @param {import('discord.js').Message} message The message object that triggered the reply.
 * @param {import('discord.js').Client} client The bot client instance.
 * @returns {Promise<string>} The generated reply text.
 */
async function generateReply(message, client) {
    const config = await getChatGPTConfig(message.guild.id);
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OpenAI API key is not configured on the server.');
    }

    // Build conversation history
    const conversation = [];
    if (config.systemPrompt) {
        conversation.push({ role: 'system', content: config.systemPrompt });
    }

    // Fetch up to 10 previous messages to build context
    const messageHistory = await message.channel.messages.fetch({ limit