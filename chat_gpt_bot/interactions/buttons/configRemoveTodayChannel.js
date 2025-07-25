const { MessageFlags } = require('discord.js');
const { isChatGptAdmin } = require('../../../permissionManager');
const { setChatGPTConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

/**
 * 権限チェック＋エラーメッセージ表示を共通化（必要に応じて外出し可）
 * @param {import('discord.js').Interaction} interaction
 * @returns {Promise<boolean>} trueなら権限あり、falseなら権限なしで処理終了済み
 */
async function checkAdminPermission(interaction) {
  if (!(await isChatGptAdmin(interaction))) {
    await interaction.followUp({
      content: '🚫 この操作を実行する権限がありません。',
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }
  return true;
}

module.exports = {
  customId: 'chatgpt_config_remove_today_channel',
  async handle(interaction) {
    try {
      await interaction.deferUpdate();

      // 権限チェック。なければここで終わる。
      if (!(await checkAdminPermission(interaction))) return;

      // 「今日のChatGPT」投稿チャンネル設定を解除（nullを明示的に設定）
      await setChatGPTConfig(interaction.guildId, { today_gpt_channel_id: null });

      // 設定解除の完了メッセージを更新
      await interaction.update({
        content:
          '✅ 「今日のChatGPT」投稿チャンネルの設定を解除しました。\n再度 `/legion_chatgpt_設定` を実行して確認してください。',
        components: [],
      });
    } catch (error) {
      // エラーは専用ハンドラーで処理（コンソールにも出力される想定）
      await handleInteractionError({
        interaction,
        error,
        context: '「今日のChatGPT」チャンネル設定解除',
      });
    }
  },
};
