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

        // workaround for id being a string
        const hiddenCoachesResultData: {id: string, name: string}[] = hiddenCoachesResult.data;
        const hiddenCoaches: Coach[] = [];
        for (const coachWithWrongType of hiddenCoachesResultData) {
            hiddenCoaches.push({
                id: ~~coachWithWrongType.id,
                name: coachWithWrongType.name,
                ranking: 'unknown',
            });
        }
        // end of workaround for id being a string

        return {
            audio: true,
            hiddenCoaches: hiddenCoaches,
        };
    }

    public async setGameFinderVar(gameFinderVar: GameFinderVar, value: string): Promise<void> {
        var bodyFormData = new FormData();
        bodyFormData.append('value', value);
        await Axios({
            method: "post",
            url: '/api/coach/setvar/' + gameFinderVar,
            data: bodyFormData,
            headers: { "Content-Type": `multipart/form-data; boundary=${bodyFormData._boundary}` },
        });
    }

    public async hideCoach(coachName: string): Promise<void> {
        await Axios.post('/api/coach/hide/' + coachName);
    }

    public async unhideCoach(coachName: string): Promise<void> {
        await Axios.post('/api/coach/unhide/' + coachName);
    }
}