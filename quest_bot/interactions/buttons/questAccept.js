// quest_bot/interactions/buttons/questAccept.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');

module.exports = {
  customId: 'quest_open_acceptModal_', // Prefix match
  async handle (interaction) {
    try {
      const questId = interaction.customId.split('_')[3];
      const quest = await questDataManager.getQuest(interaction.guildId, questId);

      if (!quest) {
        return interaction.reply({ content: '⚠️ 対象のクエストデータが見つかりません。', flags: MessageFlags.Ephemeral });
      }
      if (quest.isClosed || quest.isArchived) {
        return interaction.reply({ content: '⚠️ このクエストは現在募集を締め切っています。', flags: MessageFlags.Ephemeral });
      }

      // ユーザーが既に受注済みかチェック
      const hasAlreadyAccepted = quest.accepted?.some(a => a.userId === interaction.user.id);
      if (hasAlreadyAccepted) {
        return interaction.reply({ content: '⚠️ あなたは既にこのクエストを受注済みです。受注内容を変更する場合は、一度「受注取消」を行ってから再度受注してください。', flags: MessageFlags.Ephemeral });
      }

      // Filter out failed participants before calculating totals
      const activeAccepted = quest.accepted?.filter(a => a.status !== 'failed') || [];

      // Calculate remaining slots based on active participants
      const currentAcceptedTeams = activeAccepted.reduce((sum, a) => sum + a.teams, 0);
      const currentAcceptedPeople = activeAccepted.reduce((sum, a) => sum + a.people, 0);
      const remainingTeams = quest.teams - currentAcceptedTeams;
      const remainingPeople = quest.people - currentAcceptedPeople;

      if (remainingTeams <= 0 && remainingPeople <= 0) {
          return interaction.reply({ content: '⚠️ このクエストは既に定員に達しています。', flags: MessageFlags.Ephemeral });
      }

      const modal = new ModalBuilder()
        .setCustomId(`quest_submit_acceptModal_${questId}`)
        .setTitle('クエストの受注');

      const teamsInput = new TextInputBuilder()
        .setCustomId('accept_teams')
        .setLabel(`受注する組数 (残り: ${remainingTeams}組)`)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('例: 1')
        .setRequired(true);

      const peopleInput = new TextInputBuilder()
        .setCustomId('accept_people')
        .setLabel(`受注する人数 (残り: ${remainingPeople}人)`)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('例: 4')
        .setRequired(true);

      const commentInput = new TextInputBuilder()
        .setCustomId('accept_comment')
        .setLabel('備考（任意）')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('なんでもどうぞ')
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(teamsInput),
        new ActionRowBuilder().addComponents(peopleInput),
        new ActionRowBuilder().addComponents(commentInput)
      );
      await interaction.showModal(modal);
    } catch (error) {
      console.error('クエスト受注モーダルの表示中にエラーが発生しました:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'エラーが発生したため、受注を開始できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
      }
    }
  },
};