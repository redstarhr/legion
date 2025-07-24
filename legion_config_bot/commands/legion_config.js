const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createLegionConfigPanel } = require('../components/configPanel');
const { handleInteractionError } = require('../../interactionErrorLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('legion設定')
    .setDescription('Legion Bot全体の管理者ロールを設定します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
        const panel = await createLegionConfigPanel(interaction);
        await interaction.reply(panel);
    } catch (error) {
        await handleInteractionError({ interaction, error, context: 'Legion設定表示' });
    }
  },
};