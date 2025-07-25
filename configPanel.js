// e:/共有フォルダ/legion/legion_config_bot/components/configPanel.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const configDataManager = require('../../manager/configDataManager');

/**
 * Legion Bot全体の管理者設定パネルを生成します。
 * @param {import('discord.js').Interaction} interaction
 */
async function createLegionConfigPanel(interaction) {
    const config = await configDataManager.getLegionConfig(interaction.guildId);
    const legionAdminRoleId = config.legionAdminRoleId;
    const questAdminRoleId = config.questAdminRoleId;
    const chatGptAdminRoleId = config.chatGptAdminRoleId;

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('legion_config_set_admin_role')
                .setLabel('Legion管理者ロール設定')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('legion_config_set_quest_admin_role')
                .setLabel('Quest Bot管理者ロール設定')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('legion_config_set_gpt_admin_role')
                .setLabel('ChatGPT Bot管理者ロール設定')
                .setStyle(ButtonStyle.Secondary)
        );

    const description = `Bot全体の管理者ロールを設定します。\n\n**現在の設定:**\n` +
        `> **Legion管理者:** ${legionAdminRoleId ? `<@&${legionAdminRoleId}>` : '未設定'}\n` +
        `> **Quest Bot管理者:** ${questAdminRoleId ? `<@&${questAdminRoleId}>` : '未設定'}\n` +
        `> **ChatGPT Bot管理者:** ${chatGptAdminRoleId ? `<@&${chatGptAdminRoleId}>` : '未設定'}`;

    return { content: description, components: [row], flags: MessageFlags.Ephemeral };
}

module.exports = { createLegionConfigPanel };