// quest_bot/interactions/buttons/configUnlink.js
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');

module.exports = {
  customId: 'config_open_unlinkSelect',
  async handle(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const allQuests = await questDataManager.getAllQuests(interaction.guildId);
      const linkedQuestsOptions = [];

      for (const questId in allQuests) {
        const quest = allQuests[questId];
        if (quest.linkedMessages && quest.linkedMessages.length > 0) {
          for (const linked of quest.linkedMessages) {
            const questTitle = quest.title || '無題のクエスト';
            // Discordのラベル文字数制限(100)を考慮
            const truncatedTitle = questTitle.length > 40 ? `${questTitle.substring(0, 37)}...` : questTitle;

            let channelName = '不明なチャンネル';
            try {
              const channel = await interaction.client.channels.cache.get(linked.channelId) || await interaction.client.channels.fetch(linked.channelId);
              channelName = channel.name;
            } catch (e) {
              console.warn(`Could not fetch channel name for ${linked.channelId}`);
            }

            linkedQuestsOptions.push({
              label: `[元] ${truncatedTitle} -> [連携先] #${channelName}`,
              description: `連携メッセージID: ${linked.messageId}`,
              value: `${quest.messageId}_${linked.messageId}`,
            });
          }
        }
      }

      if (linkedQuestsOptions.length === 0) {
        return interaction.followUp({ content: '現在、連携されているクエストはありません。' });
      }

      const uniqueId = `config_select_unlink_${interaction.id}`;
      const selectMenu = new StringSelectMenuBuilder().setCustomId(uniqueId).setPlaceholder('連携を解除するクエストを選択してください').addOptions(linkedQuestsOptions.slice(0, 25)); // セレクトメニューのオプション上限(25)を考慮
      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.followUp({
        content: '連携を解除したいクエスト掲示板を選択してください。選択すると、連携先のメッセージが削除され、連携が解除されます。',
        components: [row],
        ephemeral: true,
      });
    } catch (error) {
      console.error('連携解除UIの表示中にエラーが発生しました:', error);
      await interaction.followUp({ content: 'エラーが発生したため、UIを表示できませんでした。' });
    }
  },
};