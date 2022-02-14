import Axios from "axios";
import IBackendApi from "./IBackendApi"

export default class FumbblApi implements IBackendApi {

    public async addCheatingCoach(cheatingCoachName: string): Promise<void> {
        return new Promise(() => {});
    }

    public async activate(): Promise<void> {
        await Axios.post('/api/gamefinder/activate')
    };

    public async activeTeams(cheatingCoachName: string): Promise<any[]> {
        const result = await Axios.post('/api/gamefinder/coachteams');
        return result.data.teams;
    }

    public async allTeams(coachName: string): Promise<any[]> {
        const result = await Axios.post('/api/coach/teams/' + coachName);
        return result.data.teams;
    }

    public async rosterData(teamId: number): Promise<any> {
        const result = await Axios.post('/api/team/get/' + teamId);
        return result.data;
    }

    public addAllTeams(cheatingCoachName: string): void {
        Axios.post('/api/gamefinder/addallteams');
    }

    public removeAllTeams(cheatingCoachName: string): void {
        Axios.post('/api/gamefinder/removeallteams');
    }

    public addTeam(id: number): void {
        Axios.post('/api/gamefinder/addteam/' + id);
    }

    public removeTeam(id: number): void {
        Axios.post('/api/gamefinder/removeteam/' + id);
    }

    public async getOffers(cheatingCoachName: string): Promise<any[]> {
        const result = await Axios.post('/api/gamefinder/getoffers');
        return result.data;
    }

    public async sendOffer(myTeamId: number, opponentTeamId: number): Promise<void> {
        await Axios.post('/api/gamefinder/offer/' + myTeamId + '/' + opponentTeamId);
    }

    public cancelOffer(id: number): void {
        Axios.post('/api/gamefinder/canceloffer/' + id);
    }

    public async teamsAsOpponents(): Promise<any[]> {
        const result = await Axios.post('/api/gamefinder/teams');
        return result.data
    }
}