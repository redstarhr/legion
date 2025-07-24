const { PermissionFlagsBits } = require('discord.js');
const configManager = require('../legion_config_bot/utils/configDataManager');

/**
 * Checks if a member has a specific role.
 * @param {import('discord.js').GuildMember} member The member to check.
 * @param {string|null} roleId The ID of the role to check for.
 * @returns {boolean}
 */
function hasRole(member, roleId) {
    return roleId && member.roles.cache.has(roleId);
}

/**
 * Checks if the user is a Legion-level administrator.
 * This includes Discord Administrators and users with the Legion Admin Role.
 * @param {import('discord.js').Interaction} interaction
 * @returns {Promise<boolean>}
 */
async function isLegionAdmin(interaction) {
    if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
    }
    const config = await configManager.getLegionConfig(interaction.guildId);
    return hasRole(interaction.member, config.legionAdminRoleId);
}

/**
 * Checks if the user has permission to manage the Quest Bot.
 * This includes Discord Admins, Legion Admins, and Quest Admins.
 * @param {import('discord.js').Interaction} interaction
 * @returns {Promise<boolean>}
 */
async function isQuestAdmin(interaction) {
    if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
    }
    const config = await configManager.getLegionConfig(interaction.guildId);
    return hasRole(interaction.member, config.legionAdminRoleId) || hasRole(interaction.member, config.questAdminRoleId);
}

/**
 * Checks if the user has permission to manage the ChatGPT Bot.
 * This includes Discord Admins, Legion Admins, and ChatGPT Admins.
 * @param {import('discord.js').Interaction} interaction
 * @returns {Promise<boolean>}
 */
async function is
async function isChatGptAdmin(interaction) {
    if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
    }
    const config = await configManager.getLegionConfig(interaction.guildId);
    return hasRole(interaction.member, config.legionAdminRoleId) || hasRole(interaction.member, config.chatGptAdminRoleId);
}

module.exports = {
    isLegionAdmin,
    isQuestAdmin,
    isChatGptAdmin,
};