// e:/共有フォルダ/legion/admin_bot/components/configPanel.js
const { EmbedBuilder, ActionRowBuilder, RoleSelectMenuBuilder } = require('discord.js');
const { getLegionConfig } = require('../../manager/configDataManager');

// Define custom IDs for the select menus to be handled later
const LEGION_ADMIN_ROLE_ID = 'config_select_legion_admin';
const QUEST_ADMIN_ROLE_ID = 'config_select_quest_admin';
const QUEST_CREATOR_ROLE_ID = 'config_select_quest_creator';
const CHATGPT_ADMIN_ROLE_ID = 'config_select_chatgpt_admin';

async function createLegionConfigPanel(interaction) {
    const config = await getLegionConfig(interaction.guildId);

    const formatRole = (roleId) => roleId ? `<@&${roleId}>` : '未設定';
    const formatRoles = (roleIds) => {
        if (!roleIds || roleIds.length === 0) return '未設定';
        return roleIds.map(id => `<@&${id}>`).join(', ');
    };

    const embed = new EmbedBuilder()
        .setTitle('⚙️ Legion Bot ロール設定')
        .setDescription('各機能の管理者ロールを設定します。メニューから設定したいロールを選択してください。')
        .setColor(0x5865F2) // Blurple
        .addFields(
            { name: '全体管理者 (Legion Admin)', value: formatRole(config.legionAdminRoleId), inline: true },
            { name: 'ChatGPT管理者 (ChatGPT Admin)', value: formatRole(config.chatGptAdminRoleId), inline: true },
            { name: '\u200B', value: '\u200B' }, // Spacer
            { name: 'クエスト管理者 (Quest Admin)', value: formatRole(config.questAdminRoleId), inline: true },
            { name: 'クエスト作成者 (Quest Creator)', value: formatRoles(config.questCreatorRoleIds), inline: true }
        )
        .setFooter({ text: 'ロールを選択すると、現在の設定が上書きされます。' });

    const legionAdminMenu = new RoleSelectMenuBuilder()
        .setCustomId(LEGION_ADMIN_ROLE_ID)
        .setPlaceholder('全体管理者ロールを選択...')
        .setMinValues(0).setMaxValues(1); // Allow clearing

    const questAdminMenu = new RoleSelectMenuBuilder()
        .setCustomId(QUEST_ADMIN_ROLE_ID)
        .setPlaceholder('クエスト管理者ロールを選択...')
        .setMinValues(0).setMaxValues(1); // Allow clearing

    const questCreatorMenu = new RoleSelectMenuBuilder()
        .setCustomId(QUEST_CREATOR_ROLE_ID)
        .setPlaceholder('クエスト作成者ロールを選択 (複数可)...')
        .setMinValues(0).setMaxValues(10); // Allow clearing and multiple selections

    const chatGptAdminMenu = new RoleSelectMenuBuilder()
        .setCustomId(CHATGPT_ADMIN_ROLE_ID)
        .setPlaceholder('ChatGPT管理者ロールを選択...')
        .setMinValues(0).setMaxValues(1); // Allow clearing

    return {
        embeds: [embed],
        components: [
            new ActionRowBuilder().addComponents(legionAdminMenu),
            new ActionRowBuilder().addComponents(chatGptAdminMenu),
            new ActionRowBuilder().addComponents(questAdminMenu),
            new ActionRowBuilder().addComponents(questCreatorMenu),
        ],
        ephemeral: true
    };
}

module.exports = { createLegionConfigPanel };