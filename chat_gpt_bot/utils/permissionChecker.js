// e:/共有フォルダ/legion/chat_gpt_bot/utils/permissionChecker.js
const { MessageFlags } = require('discord.js');
const { isChatGptAdmin } = require('../../manager/permissionManager');

/**
 * Checks if the user has ChatGPT admin permissions and replies if they don't.
 * This is a convenience wrapper to reduce boilerplate code in interaction handlers.
 * @param {import('discord.js').CommandInteraction | import('discord.js').MessageComponentInteraction | import('discord.js').ModalSubmitInteraction} interaction The interaction to check.
 * @returns {Promise<boolean>} `true` if the user has permission, `false` otherwise.
 */
async function checkAdminAndReply(interaction) {
  const hasPermission = await isChatGptAdmin(interaction);

  if (!hasPermission) {
    const replyOptions = {
      content: '🚫 この操作を実行する権限がありません。',
      flags: MessageFlags.Ephemeral,
    };

    // Use followUp if the interaction has already been deferred or replied to.
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(replyOptions).catch(() => {}); // Ignore errors if reply fails
    } else {
      await interaction.reply(replyOptions).catch(() => {}); // Ignore errors if reply fails
    }
  }

  return hasPermission;
}

module.exports = { checkAdminAndReply };