const configManager = require('../../../configDataManager');
const { createLegionConfigPanel } = require('../../components/configPanel');
const { handleInteractionError } = require('../../../interactionErrorLogger');

module.exports = {
    customId: 'legion_config_set_role_', // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferUpdate();

            const roleType = interaction.customId.replace('legion_config_set_role_', '');
            const roleId = interaction.values[0];
            const role = await interaction.guild.roles.fetch(roleId);

            let successMessage = '';

            switch (roleType) {
                case 'legion_admin':
                    await configManager.setLegionAdminRole(interaction.guildId, roleId);
                    successMessage = `✅ Legion Bot 管理者ロールを **${role.name}** に設定しました。`;
                    break;
                case 'quest_admin':
                    await configManager.setQuestAdminRole(interaction.guildId, roleId);
                    successMessage = `✅ Quest Bot 管理者ロールを **${role.name}** に設定しました。`;
                    break;
                case 'chat_gpt_admin':
                    await configManager.setChatGptAdminRole(interaction.guildId, roleId);
                    successMessage = `✅ ChatGPT Bot 管理者ロールを **${role.name}** に設定しました。`;
                    break;
                default:
                    return interaction.editReply({ content: '❌ 不明なロールタイプです。', components: [] });
            }

            const panel = await createLegionConfigPanel(interaction);
            await interaction.editReply({ content: successMessage, ...panel });

        } catch (error) {
            await handleInteractionError({ interaction, error, context: `Legionロール設定 (${interaction.customId})` });
        }
    },
};
            await interaction.editReply({ content: successMessage, ...panel });

        } catch (error) {
            await handleInteractionError({ interaction, error, context: `Legionロール設定 (${interaction.customId})` });
        }
    },
};