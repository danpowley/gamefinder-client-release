<template>
    <div id="gamefinder" :class="{zenmode: userSettings ? userSettings.zenMode : false}">
        <div class="getstateerrorbanner" v-show="stateUpdateErrorMessage">
            Gamefinder encountered an error whilst getting the latest game data, if this issue continues, please reload the page.
            <div>{{ stateUpdateErrorMessage }}</div>
        </div>

        <!-- We use v-if here because we want the component to be mounted each time display changes and force a reload of team data -->
        <lfgteams
            v-if="display === 'TEAMS'"
            :is-dev-mode="isDevMode"
            :coach-name="coachName"
            @show-lfg="showLfg"
            @blackbox-data="handleBlackboxData"></lfgteams>

        <div id="startdialog" class="basicbox" v-if="startDialogOffer !== null">
            <div class="header">Game offered</div>
            <div class="content">
                <div class="teams">
                    <div class="homeicon">
                        <img :src="getLargeTeamLogoUrl(startDialogOffer.home)" />
                    </div>
                    <div class="details">
                        <div class="homedetails">
                            <div class="name">
                                {{ startDialogOffer.home.team }}
                            </div>
                            <div class="coach">
                                {{ startDialogOffer.home.coach.name }} ({{ startDialogOffer.home.coach.rating }})
                            </div>
                            <div class="desc">
                                TV {{ startDialogOffer.home.tv }} {{ startDialogOffer.home.roster.name }}
                            </div>
                            <div v-show="startDialogOffer.home.started">
                                <strong>Coach has clicked start game.</strong>
                            </div>
                        </div>
                        <div class="awaydetails">
                            <div class="name">
                                {{ startDialogOffer.away.team }}
                            </div>
                            <div class="coach">
                                {{ startDialogOffer.away.coach.name }} ({{ startDialogOffer.away.coach.rating }})
                            </div>
                            <div class="desc">
                                {{ startDialogOffer.away.roster.name }} TV {{ startDialogOffer.away.tv }}
                            </div>
                            <div v-show="startDialogOffer.away.started">
                                <strong>Coach has clicked start game.</strong>
                            </div>
                        </div>
                    </div>
                    <div class="awayicon">
                        <img :src="getLargeTeamLogoUrl(startDialogOffer.away)" />
                    </div>
                </div>
                <div class="timer" :style="{ width: (100 * (startDialogOffer.timeRemaining) / startDialogOffer.lifetime) + '%'}"></div>
                <div class="actions">
                    <div class="centrebuttons">
                        <button @click.prevent="declineGame">Decline</button>
                        <button @click.prevent="startGame" :disabled="startDialogOffer.home.started">Start game</button>
                    </div>
                </div>
            </div>
        </div>
        <div id="launchgame" class="basicbox" v-if="launchGameOffer !== null">
            <div class="header">Game launched</div>
            <div class="content">
                Good luck, your download should start automatically (but it won't just yet, we're just testing).
            </div>
        </div>
        <div id="gamefindergrid" :class="{manyteamsgrid: me.teams.length > 4, fewteamsgrid: me.teams.length <= 4}" v-if="launchGameOffer === null" v-show="startDialogOffer === null && display === 'LFG'">
            <div class="overallstatus">
                <span class="overallinfo">You have {{ me.teams.length }} team{{ me.teams.length === 1 ? '' : 's' }} looking for a game.</span>
                <a class="chooseteamslink" href="#" @click.prevent="showTeams">Choose teams</a>
                <a class="settingslink" href="#" @click.prevent="openModal('SETTINGS', {})">Settings</a>
            </div>
            <teamcards
                :selected-own-team-id="selectedOwnTeam ? selectedOwnTeam.id : 0"
                :my-teams="me.teams"
                @select="selectTeam"></teamcards>
            <div id="offers">
                <blackbox
                    v-if="featureFlags.blackbox"
                    :available="blackboxData.available"
                    :chosen="blackboxData.chosen"></blackbox>

                <offers
                    :is-dev-mode="isDevMode"
                    :matches="matchesAndTeamsState.matches"
                    :matches-last-updated="matchesAndTeamsStateLastUpdated"
                    :offers="offers"
                    :coach-name="coachName"
                    :my-teams="me.teams"
                    :hidden-coaches="userSettings ? userSettings.hiddenCoaches : []"
                    :audio-enabled="userSettings ? userSettings.audio : true"
                    @hide-match="handleHideMatch"
                    @open-modal="openModal"
                    @show-dialog="handleShowDialog"
                    @launch-game="handleLaunchGame"></offers>
            </div>
            <div id="opponents">
                <selectedownteam
                    :team="selectedOwnTeam"
                    :teamSettingsEnabled="featureFlags.teamSettings"
                    @deselect-team="deselectTeam"
                    @open-modal="openModal"></selectedownteam>

                <opponents
                    :is-dev-mode="isDevMode"
                    :coach-name="coachName"
                    :matches-and-teams-state="matchesAndTeamsState"
                    :matches-and-teams-state-last-updated="matchesAndTeamsStateLastUpdated"
                    :opponent-map="opponentMap"
                    :selected-own-team="selectedOwnTeam"
                    :selected-own-team-offered-team-ids="selectedOwnTeamOfferedTeamIds"
                    :hidden-coach-count="userSettings ? userSettings.hiddenCoaches.length : 0"
                    @refresh="refresh"
                    @hide-match="handleHideMatch"
                    @hide-coach="handleHideCoach"
                    @open-modal="openModal"></opponents>
            </div>
        </div>

        <roster
            :is-dev-mode="isDevMode"
            :settings="modalRosterSettings"
            @close-modal="closeModal"></roster>

        <settings
            :is-dev-mode="isDevMode"
            :is-open="modalSettingsShow"
            :user-settings="userSettings"
            @unhide-coach="handleUnhideCoach"
            @user-settings-changed="handleUserSettingsChanged"
            @close-modal="closeModal"></settings>

        <teamsettings v-if="featureFlags.teamSettings" :team="modalTeamSettingsTeam" @close-modal="closeModal"></teamsettings>

        <stateupdatespaused
            :paused="stateUpdatesArePaused"
            @continue-session="handleContinueSession"></stateupdatespaused>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import Component from "vue-class-component"
import { Util } from "../../core/util"
import GameFinderPolicies from "./include/GameFinderPolicies";
import LfgTeamsComponent from "./components/LfgTeams.vue";
import BlackboxComponent from "./components/Blackbox.vue";
import SettingsComponent from "./components/Settings.vue";
import TeamSettingsComponent from "./components/TeamSettings.vue";
import RosterComponent from "./components/Roster.vue";
import TeamCardsComponent from "./components/TeamCards.vue";
import SelectedOwnTeamComponent from "./components/SelectedOwnTeam.vue";
import OffersComponent from "./components/Offers.vue";
import OpponentsComponent from "./components/Opponents.vue";
import StateUpdatesPausedComponent from "./components/StateUpdatesPaused.vue";
import IBackendApi from "./include/IBackendApi";
import GameFinderHelpers from "./include/GameFinderHelpers";
import { Coach, UserSettings } from "./include/Interfaces";

@Component({
    components: {
        'lfgteams': LfgTeamsComponent,
        'blackbox': BlackboxComponent,
        'settings': SettingsComponent,
        'teamsettings': TeamSettingsComponent,
        'roster': RosterComponent,
        'teamcards': TeamCardsComponent,
        'selectedownteam': SelectedOwnTeamComponent,
        'offers': OffersComponent,
        'opponents': OpponentsComponent,
        'stateupdatespaused': StateUpdatesPausedComponent
    }
})
export default class GameFinder extends Vue {
    public isDevMode: boolean = false;
    private backendApi: IBackendApi;

    public coachName: string | null = null;
    public display: 'LFG' | 'TEAMS' = 'LFG';
    public featureFlags = {blackbox: false, teamSettings: false};
    public userSettings: UserSettings | null = null;

    public secondsBetweenGetStateCalls: number = 1;
    public stateUpdatesArePaused: boolean = false;
    public stateUpdateErrorMessage: string | null = null;

    public startDialogOffer:any = null;
    public launchGameOffer:any = null;

    public selectedOwnTeam:any = null;
    public me:any = { teams: [] };

    public opponentMap: Map<string, any> = new Map<string, any>();
    private readHistory: Map<number, number[]> = new Map<number, number[]>();

    // the offers property is primarily managed by the OffersComponent, they're held here and passed to OffersComponent as a prop
    public offers:any = [];
    public matchesAndTeamsState: {matches: any[], teams: any[]} = {matches: [], teams: []};
    public matchesAndTeamsStateLastUpdated: number = 0;

    public blackboxData: {available: number, chosen: number} = {available: 0, chosen: 0};

    public modalRosterSettings: {isMyTeam: boolean, displayTeam: any, ownTeamsOfferable: any[]} | null = null;
    public modalTeamSettingsTeam: any | null = null;
    public modalSettingsShow: boolean = false;

    async beforeMount() {
        const appElement = document.getElementById("vuecontent");
        this.coachName = appElement.getAttribute("coach");
        this.isDevMode = appElement.hasAttribute("dev-mode-on");
        this.backendApi = GameFinderHelpers.getBackendApi(this.isDevMode);
    }

    async mounted() {
        await this.backendApi.activate();
        this.userSettings = await this.backendApi.getUserSettings();

        this.refresh();

        document.addEventListener('click', this.onOuterModalClick);

        this.beginGetStatePolling();
    }

    public async beginGetStatePolling() {
        await this.getState();

        const getStateWithSetTimeout = async () => {
            if (this.matchesAndTeamsStateLastUpdated !== 0 && this.matchesAndTeamsStateLastUpdated < Date.now() - 10000) {
                this.stateUpdatesArePaused = true;
                return;
            }

            try {
                await this.getState();
                this.stateUpdateErrorMessage = null;
            } catch (error) {
                this.stateUpdateErrorMessage = (error as Error).name + ': ' + (error as Error).message;
            }

            setTimeout(getStateWithSetTimeout, this.secondsBetweenGetStateCalls*1000);
        };

        getStateWithSetTimeout();
    }

    public async getState()
    {
        const matchesAndTeamsState = await this.backendApi.getState();
        this.refreshMyTeams(matchesAndTeamsState);
        this.refresh();
        this.matchesAndTeamsState = matchesAndTeamsState;
        this.matchesAndTeamsStateLastUpdated = Date.now();
    }

    private refreshMyTeams(matchesAndTeamsState: {matches: any[], teams: any[]})
    {
        let myTeams: any[] | null = null;
        for(const coachTeams of matchesAndTeamsState.teams) {
            const coachName: string = coachTeams.name;
            if (coachName === this.coachName) {
                // @christer: we should probably do a clone here
                myTeams = coachTeams.teams;
                break;
            }
        }

        if (myTeams === null || myTeams.length === 0) {
            this.me.teams = [];
            return;
        }

        Util.applyDeepDefaults(myTeams, [{
            allow: [],
            hasUnreadItems: false
        }], this.$set);

        for (const match of matchesAndTeamsState.matches) {
            if (match.visible === true) {
                const myTeamIsTeam1 = match.team1.coach.name === this.coachName;
                const myTeamId = myTeamIsTeam1 ? match.team1.id : match.team2.id;
                const opponentTeamId = myTeamIsTeam1 ? match.team2.id : match.team1.id;
                const opponentCoachId = myTeamIsTeam1 ? match.team2.coach.id : match.team1.coach.id;

                if (! this.isCoachHidden(opponentCoachId)) {
                    for (const myTeam of myTeams) {
                        if (myTeam.id === myTeamId) {
                            myTeam.allow.push(opponentTeamId);
                        }
                    }
                }
            }
        }

        // Refresh the selectedOwnTeam object, now it has changed its allow property
        if (this.selectedOwnTeam !== null) {
            for (const myTeam of this.me.teams) {
                if (this.selectedOwnTeam.id === myTeam.id) {
                    this.selectedOwnTeam = myTeam;
                }
            }
        }

        myTeams.sort(GameFinderPolicies.sortTeamByDivisionNameLeagueNameTeamName);
        this.me.teams = myTeams;
    }

    public async showLfg() {
        await this.backendApi.activate();
        await this.getState();

        // always select if only 1 team
        if (this.me.teams.length === 1) {
            const onlyTeam = this.me.teams[0];
            this.selectedOwnTeam = onlyTeam;
        }

        this.display = 'LFG'
    }

    public async showTeams() {
        this.display = 'TEAMS';
    }

    private refresh() {
        this.clearSelectedOwnTeamIfInactive();
        this.refreshOwnTeamsUnreadSettings();
        this.refreshOpponentVisibility();
    }

    private clearSelectedOwnTeamIfInactive() {
        if (this.selectedOwnTeam === null) {
            return;
        }

        let selectedOwnTeamIsActive = false;
        for (let myTeam of this.me.teams) {
            if (myTeam.id === this.selectedOwnTeam.id) {
                selectedOwnTeamIsActive = true;
            }
        }

        if (! selectedOwnTeamIsActive) {
            this.selectedOwnTeam = null;
        }
    }

    private refreshOwnTeamsUnreadSettings() {
        for (const team of this.me.teams) {
            if (this.selectedOwnTeam && team.id === this.selectedOwnTeam.id) {
                team.hasUnreadItems = false;
                continue;
            }
            if (team.allow.length === 0) {
                team.hasUnreadItems = false;
                continue;
            }

            if (! this.readHistory.has(team.id)) {
                team.hasUnreadItems = true;
                continue;
            }

            let newEntriesFound = false;
            const teamReadHistory = this.readHistory.get(team.id);
            for (const oppTeamId of team.allow) {
                if (! teamReadHistory.includes(oppTeamId)) {
                    newEntriesFound = true;
                    break;
                }
            }
            team.hasUnreadItems = newEntriesFound;
        }
    }

    private refreshOpponentVisibility() {
        this.opponentMap.forEach(opponent => {
            let opponentVisible = true;
            for (const coach of this.userSettings.hiddenCoaches) {
                if (coach.id === opponent.id) {
                    opponentVisible = false;
                    break;
                }
            }
            opponent.visible = opponentVisible;

            let numVisibleTeams = 0;
            for (let oppTeam of opponent.teams) {
                if (this.selectedOwnTeam) {
                    oppTeam.visible = this.selectedOwnTeam.allow.includes(oppTeam.id);
                } else {
                    oppTeam.visible = true;
                }

                if (oppTeam.visible) {
                    numVisibleTeams++;
                }
            }
            opponent.visibleTeams = numVisibleTeams;
        });
    }

    // Used by Opponents component to show which teams you've sent offers to.
    public get selectedOwnTeamOfferedTeamIds(): number[] {
        const selectedOwnTeamOfferedTeamIds = [];

        if (! this.selectedOwnTeam) {
            return selectedOwnTeamOfferedTeamIds;
        }

        for (const offer of this.offers) {
            if (offer.external === false && offer.home.id === this.selectedOwnTeam.id) {
                selectedOwnTeamOfferedTeamIds.push(offer.away.id);
            }
        }

        return selectedOwnTeamOfferedTeamIds;
    }

    private updateReadHistoryForSelectedOwnTeam() {
        if (! this.selectedOwnTeam) {
            return;
        }

        this.selectedOwnTeam.hasUnreadItems = false;

        if (! this.readHistory.has(this.selectedOwnTeam.id)) {
            this.readHistory.set(this.selectedOwnTeam.id, []);
        }

        const teamReadHistory = this.readHistory.get(this.selectedOwnTeam.id);
        for (const oppTeamId of this.selectedOwnTeam.allow) {
            if (! teamReadHistory.includes(oppTeamId)) {
                teamReadHistory.push(oppTeamId);
            }
        }
    }

    public selectTeam(team) {
        if (this.selectedOwnTeam && this.selectedOwnTeam.id === team.id) {
            this.deselectTeam();
        } else {
            this.selectedOwnTeam = team;
            this.updateReadHistoryForSelectedOwnTeam();
            this.refresh();
        }
    }

    public deselectTeam() {
        this.selectedOwnTeam = null;

        this.refresh();
    }

    public handleBlackboxData(blackboxData: {available: number, chosen: number}) {
        this.blackboxData = blackboxData;
    }

    public handleHideMatch(myTeamId: number, opponentTeamId: number): void {
        this.removeAllowedUiOnly(myTeamId, opponentTeamId);
        this.removeOfferUiOnly(myTeamId, opponentTeamId);
        this.backendApi.cancelOffer(myTeamId, opponentTeamId);
    }

    private removeAllowedUiOnly(myTeamId: number, opponentTeamId: number): void {
        for (const myTeam of this.me.teams) {
            if (myTeam.id === myTeamId) {
                const index = myTeam.allow.findIndex((teamId) => teamId === opponentTeamId);
                if (index !== -1) {
                    myTeam.allow.splice(index, 1);
                }
            }
        }
    }

    private removeOfferUiOnly(myTeamId: number, opponentTeamId: number): void
    {
        const index = this.offers.findIndex((o) => o.home.id === myTeamId && o.away.id === opponentTeamId);
        if (index !== -1) {
            this.offers.splice(index, 1);
        }
    }

    public async handleHideCoach(coach: Coach): Promise<void> {
        await this.backendApi.hideCoach(coach.name);
        this.userSettings = await this.backendApi.getUserSettings();
        this.refreshOpponentVisibility();
    }

    public async handleUnhideCoach(coach: Coach): Promise<void> {
        await this.backendApi.unhideCoach(coach.name);
        this.userSettings = await this.backendApi.getUserSettings();
        this.refreshOpponentVisibility();
    }

    public async handleUserSettingsChanged() {
        this.userSettings = await this.backendApi.getUserSettings();
    }

    public handleShowDialog(startDialogOffer: any | null): void {
        this.startDialogOffer = startDialogOffer;
    }

    public handleLaunchGame(launchGameOffer: any | null): void {
        // launchGameOffer cannot go back to null.
        if (launchGameOffer !== null) {
            this.launchGameOffer = launchGameOffer;
        }
    }

    public declineGame()
    {
        if (this.startDialogOffer === null) {
            return;
        }
        this.handleHideMatch(this.startDialogOffer.home.id, this.startDialogOffer.away.id);
    }

    public startGame()
    {
        if (this.startDialogOffer === null) {
            return;
        }
        this.backendApi.startGame(this.startDialogOffer.home.id, this.startDialogOffer.away.id);
    }

    private getHiddenCoachIndex(id: number): number {
        return this.userSettings.hiddenCoaches.findIndex((coach) => coach.id === id);
    }

    private isCoachHidden(id: number): boolean {
        return this.getHiddenCoachIndex(id) !== -1;
    }

    private onOuterModalClick(e) {
        const clickTarget = e.target;
        const modals = [
            document.querySelector('.rosterouter, .settingsouter, .teamsettingsouter'),
        ];
        for (const modal of modals) {
            if (clickTarget == modal) {
                this.closeModal();
            }
        }
    }

    public openModal(modalName: string, modalSettings: any) {
        this.closeModal();
        if (modalName === 'ROSTER') {
            this.modalRosterSettings = this.getModalRosterSettings(modalSettings.team);
        } else if (modalName === 'TEAM_SETTINGS') {
            this.modalTeamSettingsTeam = modalSettings.team;
        } else if (modalName === 'SETTINGS') {
            this.modalSettingsShow = true;
        }
    }

    private getModalRosterSettings(rosterTeam: any): {isMyTeam: boolean, displayTeam: any, ownTeamsOfferable: any[]} {
        let isMyTeam = false;
        for (const myTeam of this.me.teams) {
            if (myTeam.id === rosterTeam.id) {
                isMyTeam = true;
            }
        }

        const ownTeamsOfferable = [];

        if (! isMyTeam) {
            for (const myTeam of this.me.teams) {
                const isAllowed = myTeam.allow.includes(rosterTeam.id);
                const offerExists = this.offerExists(myTeam.id, rosterTeam.id);
                if (isAllowed && ! offerExists) {
                    ownTeamsOfferable.push(myTeam);
                }
            }
        }

        return {
            isMyTeam: isMyTeam,
            displayTeam: rosterTeam,
            ownTeamsOfferable: ownTeamsOfferable
        };
    }

    private offerExists(myTeamId, opponentTeamId): boolean {
        for (const offer of this.offers) {
            if (offer.home.id === myTeamId && offer.away.id === opponentTeamId) {
                return true;
            }
        }
        return false;
    }

    public closeModal() {
        this.modalRosterSettings = null;
        this.modalTeamSettingsTeam = null;
        this.modalSettingsShow = false;
    }

    public getLargeTeamLogoUrl(team: any): string {
        return GameFinderHelpers.getTeamLogoUrl(team, false);
    }

    public async handleContinueSession() {
        this.stateUpdatesArePaused = false;
        await this.backendApi.activate();
        this.beginGetStatePolling();
    }
}
</script>