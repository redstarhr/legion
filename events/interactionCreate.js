// events/interactionCreate.js

const { handleInteractionError } = require('../utils/interactionErrorLogger');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) await command.execute(interaction);

      } else if (interaction.isButton()) {
        for (const [key, handler] of client.buttons) {
          if (interaction.customId.startsWith(key)) {
            await handler.handle(interaction);
            return;
          }
        }

      } else if (interaction.isAnySelectMenu()) {
        for (const [key, handler] of client.selectMenus) {
          if (interaction.customId.startsWith(key)) {
            await handler.handle(interaction);
            return;
          }
        }

      } else if (interaction.isModalSubmit()) {
        for (const [key, handler] of client.modals) {
          if (interaction.customId.startsWith(key)) {
            await handler.handle(interaction);
            return;
          }
        }
      }
    } catch (error) {
      await handleInteractionError({
        interaction,
        error,
        context: `interactionCreate: ${interaction.customId || interaction.commandName}`
      });
    }
  },
};
