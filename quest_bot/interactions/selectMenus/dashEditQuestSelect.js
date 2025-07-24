// quest_bot/interactions/selectMenus/dashEditQuestSelect.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { handleInteractionError } = require('../../../interactionErrorLogger');

module.exports = {
    customId: 'dash_select_editQuest_', // Prefix match
    async handle(interaction) {
        try {
            const questId = interaction.values[0];
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!quest) {
                return interaction.update({ content: '⚠️ 選択されたクエストが見つかりませんでした。ダッシュボードが更新されるまでお待ちください。', components: [] });
            }

            if (quest.isArchived) {
                return interaction.update({ content: '⚠️ 完了済みのクエストは編集できません。', components: [] });
            }

            // Build the same modal as the quest_edit button
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
                new ActionRowBuilder().addComponents(peopleInput),
                new ActionRowBuilder().addComponents(deadlineInput)
            );

            await interaction.showModal(modal);

        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ダッシュボードからのクエスト編集モーダル表示' });
        }
    },
};