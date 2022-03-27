import IBackendApi from "./IBackendApi"
import Axios from "axios"

export default class DummyApi implements IBackendApi {
    readonly dummyApiDomain = 'http://localhost:3000';

    private getFullApiEndPointUrl(endPoint: string): string {
        return this.dummyApiDomain + endPoint;
    }

    public async activate(): Promise<void> {
        await Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/activate'))
    };

    public async activeTeams(): Promise<any[]> {
        const result = await Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/coachteams'));
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

    public async getOffers(): Promise<any[]> {
        const result = await Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/getoffers'));
        return result.data;
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

    public async teamsAsOpponents(): Promise<any[]> {
        const result = await Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/teams'));
        return result.data
    }
}