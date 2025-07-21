// interactions/buttons/questEditModal.js

const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');

module.exports = {
  customId: 'quest_edit_modal',

  async handle(interaction) {
    if (!(await hasQuestManagerPermission(interaction))) {
      return interaction.reply({ content: '⚠️ あなたにはこのクエストを修正する権限がありません。', ephemeral: true });
    }

    const quest = questDataManager.getQuest(interaction.guildId, interaction.message.id);

    if (!quest) {
      return interaction.reply({ content: '⚠️ 対象のクエストデータが見つかりません。', ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId(`quest_edit_submit_${interaction.message.id}`)
      .setTitle('クエストの修正');

    const titleInput = new TextInputBuilder()
      .setCustomId('quest_title_input')
      .setLabel('クエストのタイトル')
      .setStyle(TextInputStyle.Short)
      .setValue(quest.title || '') // 既存の値を設定
      .setRequired(false);

    const descriptionInput = new TextInputBuilder()
      .setCustomId('quest_description_input')
      .setLabel('クエストの詳細')
      .setStyle(TextInputStyle.Paragraph)
      .setValue(quest.description || '') // 既存の値を設定
      .setRequired(false);

    const teamsInput = new TextInputBuilder()
      .setCustomId('teams_input')
      .setLabel('募集する組数')
      .setStyle(TextInputStyle.Short)
      .setValue(String(quest.teams)) // 既存の値を設定
      .setRequired(true);

    const peopleInput = new TextInputBuilder()
      .setCustomId('people_input')
      .setLabel('募集する人数')
      .setStyle(TextInputStyle.Short)
      .setValue(String(quest.people)) // 既存の値を設定
      .setRequired(true);

    const deadlineInput = new TextInputBuilder()
      .setCustomId('quest_deadline_input')
      .setLabel('クエストの期限（任意）')
      .setStyle(TextInputStyle.Short)
      .setValue(quest.deadline || '') // 既存の値を設定
      .setPlaceholder('例: 2023/12/31 21:00')
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(descriptionInput),
      new ActionRowBuilder().addComponents(teamsInput),
      new ActionRowBuilder().addComponents(peopleInput),
      new ActionRowBuilder().addComponents(deadlineInput)
    );

    await interaction.showModal(modal);
  },
};