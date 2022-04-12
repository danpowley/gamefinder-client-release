import Axios from "axios";
import IBackendApi from "./IBackendApi"
import { UserSettings } from "./Interfaces";

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
        // backend not implemented
        return {
            audio: true,
        };
    }

    public updateUserSetting(settingKey: string, settingValue: boolean | string | number): void {
        // not implemented
    }
}