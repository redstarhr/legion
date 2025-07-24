
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const questDataManager = require('../../../manager/questDataManager');
const { canEditQuest } = require('../../../manager/permissionManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
    customId: 'quest_edit_', // Prefix match
    async handle(interaction) {
        try {
            const questId = interaction.customId.replace('quest_edit_', '');
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!quest) {
                return interaction.reply({ content: '⚠️ 対象のクエストが見つかりませんでした。', flags: MessageFlags.Ephemeral });
            }

            if (!(await canEditQuest(interaction, quest))) {
                return interaction.reply({ content: '🚫 このクエストを編集する権限がありません。', flags: MessageFlags.Ephemeral });
            }

            if (quest.isArchived) {
                return interaction.reply({ content: '⚠️ 完了済みのクエストは編集できません。', flags: MessageFlags.Ephemeral });
            }

            const modal = new ModalBuilder()
                .setCustomId(`quest_edit_submit_${questId}`)
                .setTitle('クエストの編集');

            const titleInput = new TextInputBuilder()
                .setCustomId('quest_title')
                .setLabel('クエストタイトル')
                .setStyle(TextInputStyle.Short)
                .setValue(quest.title || quest.name || '')
                .setRequired(true)
                .setMaxLength(100);

            const descriptionInput = new TextInputBuilder()
                .setCustomId('quest_description')
                .setLabel('クエスト詳細')
                .setStyle(TextInputStyle.Paragraph)
                .setValue(quest.description || '')
                .setRequired(false)
                .setMaxLength(1000);

            const teamsInput = new TextInputBuilder()
                .setCustomId('quest_teams')
                .setLabel('募集 組数')
                .setStyle(TextInputStyle.Short)
                .setValue(String(quest.teams || '1'))
                .setRequired(true);

            const peopleInput = new TextInputBuilder()
                .setCustomId('quest_people')
                .setLabel('募集 人数（1組あたり）')
                .setStyle(TextInputStyle.Short)
                .setValue(String(quest.people || quest.players || '1'))
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
            await handleInteractionError({ interaction, error, context: 'クエスト編集モーダル表示' });
        }
    },