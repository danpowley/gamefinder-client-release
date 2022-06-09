import Axios from "axios";
import FormData from 'form-data';
import IBackendApi from "./IBackendApi"
import { Coach, GameFinderVar, UserSettings } from "./Interfaces";

export default class FumbblApi implements IBackendApi {
    public async activate(): Promise<void> {
        await Axios.post('/api/gamefinder/activate');
    }

    public async getState(): Promise<any> {
        const result = await Axios.post('/api/gamefinder/state');
        return result.data;
    }

    public async allTeams(coachName: string): Promise<any[]> {
        const result = await Axios.post('/api/gamefinder/canlfg/' + coachName);
        return result.data;
    }

    public async rosterData(teamId: number): Promise<any> {
        const result = await Axios.post('/api/team/get/' + teamId);
        return result.data;
    }

    public async rosterSettings(rosterId: number): Promise<any> {
        const result = await Axios.post('/api/roster/get/' + rosterId);
        return result.data;
    }

    public addAllTeams(): void {
        Axios.post('/api/gamefinder/addallteams');
    }

    public removeAllTeams(): void {
        Axios.post('/api/gamefinder/removeallteams');
    }

    public addTeam(id: number): void {
        Axios.post('/api/gamefinder/addteam/' + id);
    }

    public removeTeam(id: number): void {
        Axios.post('/api/gamefinder/removeteam/' + id);
    }

    public async sendOffer(myTeamId: number, opponentTeamId: number): Promise<void> {
        await Axios.post('/api/gamefinder/offer/' + myTeamId + '/' + opponentTeamId);
    }

    public cancelOffer(myTeamId: number, opponentTeamId: number): void {
        Axios.post('/api/gamefinder/canceloffer/' + myTeamId + '/' + opponentTeamId);
    }

    public startGame(myTeamId: number, opponentTeamId: number): void {
        Axios.post('/api/gamefinder/startgame/' + myTeamId + '/' + opponentTeamId);
    };

    public async getUserSettings(): Promise<UserSettings> {
        const hiddenCoachesResult = await Axios.get('/api/coach/gethidden');

        const hiddenCoaches: Coach[] = hiddenCoachesResult.data;

        const gameFinderUserSettingsPrefix = 'gamefinder.';
        const gameFinderUserSettings = await Axios.get('/api/coach/getvar/' + gameFinderUserSettingsPrefix);

        const showUnofferableTeamsVar: GameFinderVar = 'gamefinder.showUnofferableTeams';
        const enableSoundVar: GameFinderVar = 'gamefinder.enableSound';
        const enableZenModeVar: GameFinderVar = 'gamefinder.zenMode';

        return {
            showUnofferableTeams: gameFinderUserSettings.data[showUnofferableTeamsVar] === 'Yes',
            audio: gameFinderUserSettings.data[enableSoundVar] === 'Yes',
            hiddenCoaches: hiddenCoaches,
            zenMode: gameFinderUserSettings.data[enableZenModeVar] === 'Yes',
        };
    }

    public async setGameFinderVar(gameFinderVar: GameFinderVar, value: string): Promise<void> {
        var bodyFormData = new FormData();
        bodyFormData.append('value', value);
        await Axios({
            method: "post",
            url: '/api/coach/setvar/' + gameFinderVar,
            data: bodyFormData,
        });
    }

    public async hideCoach(coachName: string): Promise<void> {
        await Axios.post('/api/coach/hide/' + coachName);
    }

    public async unhideCoach(coachName: string): Promise<void> {
        await Axios.post('/api/coach/unhide/' + coachName);
    }
}