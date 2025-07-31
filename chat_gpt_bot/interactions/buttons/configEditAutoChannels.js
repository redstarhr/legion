// chat_gpt_bot/interactions/buttons/configEditAutoChannels.js

const {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  MessageFlags,
} = require('discord.js');
const { isChatGptAdmin } = require('../../../permissionManager');
const { getChatGPTConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

// カスタムID定義
const CUSTOM_ID = {
  main: 'chatgpt_config_edit_auto_channels',
  selectAutoChannels: 'chatgpt_config_select_auto_channels',
};

/**
 * 権限チェック（将来的に utils/permissions.js に切り出し可能）
 * @param {import('discord.js').Interaction} interaction
 * @returns {Promise<boolean>}
 */
async function checkAdminPermission(interaction) {
  const isAdmin = await isChatGptAdmin(interaction);
  if (!isAdmin) {
    await interaction.reply({
      content: '🚫 この操作を実行する権限がありません。',
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }
  return true;
}

module.exports = {
  customId: CUSTOM_ID.main,

  /**
   * 自動応答チャンネルの選択 UI を表示
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async handle(interaction) {
    try {
      if (!(await checkAdminPermission(interaction))) return;

      await interaction.deferUpdate();

      // 設定データ取得
      const config = await getChatGPTConfig(interaction.guildId);
      const currentChannels = config.allowedChannels || [];

      // チャンネル選択メニュー作成
      const selectMenu = new ChannelSelectMenuBuilder()
        .setCustomId(CUSTOM_ID.selectAutoChannels)
        .setPlaceholder('自動応答を有効にするチャンネルを選択してください（複数選択可）')
        .addChannelTypes(ChannelType.GuildText)
        .setMinValues(0)
        .setMaxValues(25)
        .setDefaultValues(currentChannels);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      // 応答
      await interaction.editReply({
        content:
          '💬 ChatGPT が自動で応答するチャンネルを選択してください。\n' +
          '※ すべて選択を外すと、自動応答は無効になります。',
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
