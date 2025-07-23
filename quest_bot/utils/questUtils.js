/**
 * Calculates the current acceptance counts and remaining open slots for a quest.
 * @param {object} quest The quest object.
 * @returns {{
 *   remainingTeams: number,
 *   remainingPeople: number,
 *   currentAcceptedTeams: number,
 *   currentAcceptedPeople: number,
 *   activeAccepted: object[]
 * }}
 */
function calculateRemainingSlots(quest) {
    // Filter out participants who have been marked as 'failed'
    const activeAccepted = quest.accepted?.filter(a => a.status !== 'failed') || [];

    // Calculate the total number of teams and people already accepted
    const currentAcceptedTeams = activeAccepted.reduce((sum, a) => sum + (a.teams || 0), 0);
    const currentAcceptedPeople = activeAccepted.reduce((sum, a) => sum + (a.people || a.players || 0), 0);

    // Determine the total slots available, providing a default of 1 if not set
    const totalTeams = quest.teams || 1;
    const totalPeople = quest.people || quest.players || 1;

    // Calculate the remaining slots
    const remainingTeams = totalTeams - currentAcceptedTeams;
    const remainingPeople = totalPeople - currentAcceptedPeople;

    return { remainingTeams, remainingPeople, currentAcceptedTeams, currentAcceptedPeople, activeAccepted };
}

module.exports = { calculateRemainingSlots };