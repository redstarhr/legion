// commands/help.js

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { handleInteractionError } = require('../../utils/interactionErrorLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ヘルプ')
    .setDescription('利用可能なすべてのコマンドの一覧を表示します。'),

  async execute(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('🤖 Bot コマンドヘルプ')
        .setColor(0x00bfff);

      const commandList = interaction.client.commands.map(cmd => {
        return `**/${cmd.data.name}**\n${cmd.data.description}`;
      }).join('\n\n');

      embed.setDescription(commandList);

      // If you want to separate commands by module, you can implement more complex logic here.
      // For now, a single list is more maintainable.

      // Example of separating by permission (optional)
      // const adminCommands = client.commands.filter(cmd => cmd.data.default_member_permissions !== '0').map(c => c.data.name);
      // const userCommands = client.commands.filter(cmd => cmd.data.default_member_permissions === '0').map(c => c.data.name);


      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral, // コマンド実行者のみに見えるようにする
      });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'ヘルプコマンド実行' });
    }
  },
};