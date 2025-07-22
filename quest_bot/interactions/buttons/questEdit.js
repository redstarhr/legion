// quest_bot/interactions/buttons/questEdit.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');

module.exports = {
  customId: 'quest_open_editModal_', // Prefix match
  async handle (interaction) {
    try {
      const questId = interaction.customId.split('_')[2];
      const quest = await questDataManager.getQuest(interaction.guildId, questId);

      if (!quest) {
        return interaction.reply({ content: '対象のクエストが見つかりませんでした。', ephemeral: true });
      }

      // Permission check: issuer or manager
      const isIssuer = quest.issuerId === interaction.user.id;
      const isManager = await hasQuestManagerPermission(interaction);

      if (!isIssuer && !isManager) {
        return interaction.reply({ content: 'クエストの編集は、発注者または管理者のみが行えます。', ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId(`quest_submit_editModal_${questId}`)
        .setTitle('クエスト内容の編集');

      const titleInput = new TextInputBuilder()
        .setCustomId('quest_title')
        .setLabel('クエストタイトル')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('例：レイドボス討伐メンバー募集')
        .setValue(quest.title || '')
        .setRequired(false);

      const descriptionInput = new TextInputBuilder()
        .setCustomId('quest_description')
        .setLabel('クエスト詳細')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('例：〇月〇日 21:00～\\nVC参加できる方。')
        .setValue(quest.description || '')
        .setRequired(false);

      const teamsInput = new TextInputBuilder()
        .setCustomId('quest_teams')
        .setLabel('募集 組数')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('例：3')
        .setValue(String(quest.teams || 0))
        .setRequired(true);

      const peopleInput = new TextInputBuilder()
        .setCustomId('quest_people')
        .setLabel('募集 人数（1組あたり）')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('例：4')
        .setValue(String(quest.people || 0))
        .setRequired(true);

      const deadlineInput = new TextInputBuilder()
        .setCustomId('quest_deadline')
        .setLabel('募集期限（YYYY-MM-DD HH:MM形式）')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('例：2024-12-31 23:59 (未入力で無期限)')
        .setValue(quest.deadline || '')
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descriptionInput),
        new ActionRowBuilder().addComponents(teamsInput),
        new ActionRowBuilder().addComponents(peopleInput),
        new ActionRowBuilder().addComponents(deadlineInput)
      );

      await interaction.showModal(modal);
    } catch (error) {
      console.error('クエスト編集モーダルの表示中にエラーが発生しました:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'エラーが発生したため、編集を開始できませんでした。', ephemeral: true }).catch(console.error);
      }
    }
  },
};