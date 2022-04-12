import DummyApi from "./DummyApi";
import FumbblApi from "./FumbblApi";
import IBackendApi from "./IBackendApi";

export default class GameFinderHelpers {
    public static getBackendApi(isDevMode: boolean): IBackendApi {
        if (isDevMode) {
            return new DummyApi();
        } else {
            return new FumbblApi();
        }
    }

    private static getTeamLogoId(team: any, small: boolean = true): number {
        return small ? team.roster.logoImageIds.logo32 : team.roster.logoImageIds.logo64;
    }

    public static getTeamLogoUrl(team: any, small: boolean = true): string {
        const teamLogoId = this.getTeamLogoId(team, small);
        // @christer using absolute url here, as I don't have the icons locally.
        return 'https://fumbbl.com/i/' + teamLogoId;
    }

    public static getTeamsShowDivisionLeagueHeader(teams: any[]): any {
        let previousDivision = false;
        let previousLeague = false;
        const allTeamHeadings = {};
        for (let team of teams) {
            const teamHeadings = {
                showDivisionHeader: false,
                showLeagueHeader: false,
            };

            if (previousDivision !== team.division) {
                previousDivision = team.division;
                teamHeadings.showDivisionHeader = true;
            }

            if (team.division === 'League' && previousLeague !== team.league.name) {
                previousLeague = team.league.name;
                teamHeadings.showLeagueHeader = true;
            }

            allTeamHeadings['team' + team.id] = teamHeadings;
        }
        return allTeamHeadings;
    }
}