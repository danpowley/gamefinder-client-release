export default class GameFinderPolicies {
    public static isMatchAllowed(myTeam, opponentTeam): boolean {
        if (!myTeam || !opponentTeam) {
            return false;
        }

        for (const hiddenMatchDetails of myTeam.hiddenMatches) {
            if (hiddenMatchDetails.opponentTeamId === opponentTeam.id) {
                return false;
            }
        }

        return true;
    }

    public static sortTeamByDivisionNameLeagueNameTeamName(teamA, teamB) {
        let d = teamA.division > teamB.division ? -1 : (teamA.division === teamB.division ? 0 : 1);

        if (d === 0 && teamA.division === 'League') {
            let teamALeague = teamA.league != null ? teamA.league.name : '';
            let teamBLeague = teamB.league != null ? teamB.league.name : '';
            d = teamALeague > teamBLeague ? 1 : (teamALeague === teamBLeague ? 0 : -1);
        }

        if (d === 0) {
            d = teamA.name > teamB.name ? 1 : (teamA.name === teamB.name ? 0 : -1);
        }

        return d;
    }

    public static teamIsLfg(team: any): boolean {
        return team.isLfg === true;
    }

    public static teamIsCompetitiveDivision(team: any): boolean {
        return team.division === 'Competitive';
    }
}