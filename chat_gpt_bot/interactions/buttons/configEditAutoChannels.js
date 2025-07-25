const {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  MessageFlags,
} = require('discord.js');
const { isChatGptAdmin } = require('../../../permissionManager');
const { getChatGPTConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

/**
 * 権限チェック共通関数（外部ファイル化推奨）
 * @param {import('discord.js').Interaction} interaction
 * @returns {Promise<boolean>}
 */
async function checkAdminPermission(interaction) {
  if (!(await isChatGptAdmin(interaction))) {
    await interaction.reply({
      content: '🚫 この操作を実行する権限がありません。',
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }
  return true;
}

const CUSTOM_ID = {
  selectAutoChannels: 'chatgpt_config_select_auto_channels',
};

module.exports = {
  customId: 'chatgpt_config_edit_auto_channels',

  async handle(interaction) {
    try {
      if (!(await checkAdminPermission(interaction))) return;

      await interaction.deferUpdate();

      const config = await getChatGPTConfig(interaction.guildId);
      const currentChannels = config.allowedChannels || [];

      const selectMenu = new ChannelSelectMenuBuilder()
        .setCustomId(CUSTOM_ID.selectAutoChannels)
        .setPlaceholder('自動応答を有効にするチャンネルを選択してください（複数選択可）')
        .addChannelTypes(ChannelType.GuildText)
        .setMinValues(0)
        .setMaxValues(25)
        .setDefaultValues(currentChannels);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.editReply({
        content:
          'ChatGPTが自動で応答するチャンネルを設定してください。\n' +
          'すべて選択を解除すると、自動応答は無効になります。',
        components: [row],
      });
    } catch (error) {
      await handleInteractionError({
        interaction,
        error,
        context: 'ChatGPT自動応答チャンネル設定UI',
      });
    }
  },
};
