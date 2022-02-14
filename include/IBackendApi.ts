export default interface IBackendApi {
    addCheatingCoach(cheatingCoachName: string): Promise<void>;

    activate(): Promise<void>;

    activeTeams(cheatingCoachName: string): Promise<any[]>;

    allTeams(coachName: string): Promise<any[]>;

    rosterData(teamId: number): Promise<any>;

    addAllTeams(cheatingCoachName: string): void;

    removeAllTeams(cheatingCoachName: string): void;

    addTeam(id: number): void;

    removeTeam(id: number): void;

    getOffers(cheatingCoachName: string): Promise<any[]>;

    sendOffer(myTeamId: number, opponentTeamId: number): Promise<void>;

    cancelOffer(id: number): void;

    teamsAsOpponents(): Promise<any[]>;
}
