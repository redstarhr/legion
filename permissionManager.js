const { PermissionFlagsBits } = require('discord.js');
const configManager = require('./configDataManager');

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
 * Checks if the user has permission to create/manage quests.
 * This includes Quest Admins and users with a Quest Creator Role.
 * @param {import('discord.js').Interaction} interaction
 * @returns {Promise<boolean>}
 */
async function canManageQuests(interaction) {
    // First, check for administrator-level permissions
    if (await isQuestAdmin(interaction)) {
        return true;
    }

    // Then, check for the quest creator roles
    const config = await configManager.getLegionConfig(interaction.guildId);
    const creatorRoleIds = config.questCreatorRoleIds || [];

    return creatorRoleIds.length > 0 && interaction.member.roles.cache.some(role => creatorRoleIds.includes(role.id));
}

/**
 * Checks if the user has permission to edit or manage a specific quest.
 * This includes the quest issuer and anyone who can manage quests in general.
 * @param {import('discord.js').Interaction} interaction
 * @param {object} quest The quest object to check against.
 * @returns {Promise<boolean>}
 */
async function canEditQuest(interaction, quest) {
    if (!quest) return false;

    // 1. Check if the user is the issuer of the quest.
    if (quest.issuerId === interaction.user.id) {
        return true;
    }

    // 2. Check if the user has general quest management permissions.
    return await canManageQuests(interaction);
}

/**
 * Checks if the user has permission to manage the ChatGPT Bot.
 * This includes Discord Admins, Legion Admins, and ChatGPT Admins.
 * @param {import('discord.js').Interaction} interaction
 * @returns {Promise<boolean>}
 */
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
    canManageQuests,
    canEditQuest,
    isChatGptAdmin,
};