import Axios from "axios";
import IBackendApi from "./IBackendApi";
import { Coach, GameFinderVar, UserSettings } from "./Interfaces";

export default class DummyApi implements IBackendApi {
    readonly dummyApiDomain = 'http://localhost:3000';

    private getFullApiEndPointUrl(endPoint: string): string {
        return this.dummyApiDomain + endPoint;
    }

    public async activate(): Promise<void> {
        await Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/activate'));
    }

    public async getState(): Promise<any> {
        const result = await Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/state'));
        return result.data;
    }

    public async allTeams(coachName: string): Promise<any[]> {
        const result = await Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/canlfg/' + coachName));
        return result.data;
    }

    public async rosterData(teamId: number): Promise<any> {
        const result = await Axios.post(this.getFullApiEndPointUrl('/api/team/get/' + teamId));
        return result.data;
    }

    public async rosterSettings(rosterId: number): Promise<any> {
        const result = await Axios.post(this.getFullApiEndPointUrl('/api/roster/get/' + rosterId));
        return result.data;
    }

    public addAllTeams(): void {
        Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/addallteams'));
    }

    public removeAllTeams(): void {
        Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/removeallteams'));
    }

    public addTeam(id: number): void {
        Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/addteam/' + id));
    }

    public removeTeam(id: number): void {
        Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/removeteam/' + id));
    }

    public async sendOffer(myTeamId: number, opponentTeamId: number): Promise<void> {
        await Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/offer/' + myTeamId + '/' + opponentTeamId));
    }

    public cancelOffer(myTeamId: number, opponentTeamId: number): void {
        Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/canceloffer/' + myTeamId + '/' + opponentTeamId));
    }

    public startGame(myTeamId: number, opponentTeamId: number): void {
        Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/startgame/' + myTeamId + '/' + opponentTeamId));
    };

    public async getUserSettings(): Promise<UserSettings> {
        const hiddenCoachesResult = await Axios.get(this.getFullApiEndPointUrl('/api/coach/gethidden'));

        const hiddenCoaches: Coach[] = hiddenCoachesResult.data;

        const gameFinderUserSettingsPrefix = 'gamefinder.';
        const gameFinderUserSettings = await Axios.get(this.getFullApiEndPointUrl('/api/coach/getvar/' + gameFinderUserSettingsPrefix));

        const enableSoundVar: GameFinderVar = 'gamefinder.enableSound';
        const enableZenModeVar: GameFinderVar = 'gamefinder.zenMode';

        return {
            audio: gameFinderUserSettings.data[enableSoundVar] === 'Yes',
            hiddenCoaches: hiddenCoaches,
            zenMode: gameFinderUserSettings.data[enableZenModeVar] === 'Yes',
        };
    }

    public async setGameFinderVar(gameFinderVar: GameFinderVar, value: string): Promise<void> {
        // IMPORTANT: this is posting to the proxy using a JSON body, real FUMBBL expects form data body
        // Couldn't get form data body to work with the proxy server, so doing this instead.
        // FumbblApi class uses a FormData object for the request body.
        await Axios.post(this.getFullApiEndPointUrl('/api/coach/setvar/' + gameFinderVar), {value: value});
    }

    public async hideCoach(coachName: string): Promise<void> {
        await Axios.post(this.getFullApiEndPointUrl('/api/coach/hide/' + coachName));
    }

    public async unhideCoach(coachName: string): Promise<void> {
        await Axios.post(this.getFullApiEndPointUrl('/api/coach/unhide/' + coachName));
    }
}