const { MessageFlags } = require('discord.js');
const { isChatGptAdmin } = require('../../../manager/permissionManager');
const { setChatGPTConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

const CUSTOM_ID = 'chatgpt_config_remove_today_channel';

/**
 * 管理者権限チェックとエラーメッセージ表示
 * @param {import('discord.js').Interaction} interaction
 * @returns {Promise<boolean>} 権限ありならtrue、なしならfalse（処理済み）
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

module.exports = {
  customId: CUSTOM_ID,

  async handle(interaction) {
    try {
      // 先に権限チェック（権限なければ処理終了）
      if (!(await checkAdminPermission(interaction))) return;

      // 更新の応答を遅延させる（UIの動作保証のため）
      await interaction.deferUpdate();

      // 「今日のChatGPT」投稿チャンネルの設定を解除
      await setChatGPTConfig(interaction.guildId, { today_gpt_channel_id: null });

      // 完了メッセージ更新
      await interaction.editReply({
        content:
          '✅ 「今日のChatGPT」投稿チャンネルの設定を解除しました。\n' +
          '再度 `/legion_chatgpt_パネル設置` コマンドを実行して確認してください。',
        components: [],
      });
    } catch (error) {
      await handleInteractionError({
        interaction,
        error,
        context: '「今日のChatGPT」投稿チャンネル設定解除',
      });
    }
  },
};
