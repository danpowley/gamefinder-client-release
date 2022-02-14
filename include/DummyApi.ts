import IBackendApi from "./IBackendApi"
import Axios from "axios"

export default class DummyApi implements IBackendApi {
    readonly dummyApiDomain = 'http://localhost:3000';

    private getFullApiEndPointUrl(endPoint: string): string {
        return this.dummyApiDomain + endPoint;
    }

    public async addCheatingCoach(cheatingCoachName: string): Promise<void> {
        await Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/addcheatingcoach'), {cheatingCoachName: cheatingCoachName});
    }

    public async activate(): Promise<void> {
        await Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/activate'))
    };

    public async activeTeams(cheatingCoachName: string): Promise<any[]> {
        const result = await Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/coachteams'), {cheatingCoachName: cheatingCoachName});
        return result.data.teams;
    }

    public async allTeams(coachName: string): Promise<any[]> {
        const result = await Axios.post(this.getFullApiEndPointUrl('/api/coach/teams/' + coachName));
        return result.data.teams;
    }

    public async rosterData(teamId: number): Promise<any> {
        const result = await Axios.post(this.getFullApiEndPointUrl('/api/team/get/' + teamId));
        return result.data;
    }

    public addAllTeams(cheatingCoachName: string): void {
        Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/addallteams'), {cheatingCoachName: cheatingCoachName});
    }

    public removeAllTeams(cheatingCoachName: string): void {
        Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/removeallteams'), {cheatingCoachName: cheatingCoachName});
    }

    public addTeam(id: number): void {
        Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/addteam/' + id));
    }

    public removeTeam(id: number): void {
        Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/removeteam/' + id));
    }

    public async getOffers(cheatingCoachName: string): Promise<any[]> {
        const result = await Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/getoffers'), {cheatingCoachName: cheatingCoachName});
        return result.data;
    }

    public async sendOffer(myTeamId: number, opponentTeamId: number): Promise<void> {
        await Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/offer/' + myTeamId + '/' + opponentTeamId));
    }

    public cancelOffer(id: number): void {
        Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/canceloffer/' + id));
    }

    public async teamsAsOpponents(): Promise<any[]> {
        const result = await Axios.post(this.getFullApiEndPointUrl('/api/gamefinder/teams'));
        return result.data
    }
}