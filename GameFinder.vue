<template>
    <div id="gamefinder" :class="{zenmode: userSettings ? userSettings.zenMode : false}">
        <div class="errorbanner" v-show="stateUpdateErrorMessage">
            Gamefinder encountered an error whilst getting the latest game data, if this issue continues, please reload the page.
            <div><strong>Error details: </strong>{{ stateUpdateErrorMessage }}</div>
        </div>
        <div class="errorbanner" v-show="schedulingErrorMessage">
            Sorry, an error occurred while scheduling your game.
            <div><strong>Error details: </strong>{{ schedulingErrorMessage }}</div>
        </div>

        <!-- We use v-if here because we want the component to be mounted each time display changes and force a reload of team data -->
        <lfgteams
            v-if="display === 'TEAMS' || display === 'TEAMS_ACTIVATING'"
            :is-dev-mode="isDevMode"
            :coach-name="coachName"
            :blackbox-user-activated="blackboxUserActivated"
            @show-lfg="showLfg"
            @open-modal="openModal"></lfgteams>

        <div id="startdialog" class="basicbox" v-if="startDialogOffer !== null && !isLockedForBlackboxDraw">
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
                <template v-if="schedulingErrorMessage">
                    <div>Sorry, a problem has occurred launching the game, please see the error banner above.</div>
                    <template v-if="!allowRejoinAfterDownload">
                        <p>
                            Please wait for 30 seconds for the failed offer to clear itself, then you'll be given
                            a button to rejoin Gamefinder.
                        </p>
                    </template>
                    <template v-else>
                        <p>Please use the button below to search again.</p>
                        <button @click.prevent="continueAfterLaunch">Rejoin Gamefinder</button>
                    </template>
                </template>
                <template v-else>
                    Good luck, your download should start automatically (you can also join from your coach home page).
                    <iframe :src="downloadJnlpOffer ? `https://fumbbl.com/ffblive.jnlp?id=${downloadJnlpOffer.home.id}` : ''" height="0" width="0" />
                    <div v-if="allowRejoinAfterDownload">
                        <p>You've now left the Gamefinder system, click the button below to rejoin.</p>
                        <button @click.prevent="continueAfterLaunch">Rejoin Gamefinder</button>
                    </div>
                </template>
            </div>
        </div>
        <div id="gamefindergrid" :class="{manyteamsgrid: me.teams.length > 4, fewteamsgrid: me.teams.length <= 4}" v-show="launchGameOffer === null && startDialogOffer === null && display === 'LFG'">
            <div class="overallstatus">
                <span class="overallinfo">
                    <span v-if="blackboxUserActivated">
                        Activated for Blackbox with {{ blackboxTeamCount }} {{ pluralise(blackboxTeamCount, 'team', 'teams') }}
                        ({{ me.teams.length }} {{ pluralise(me.teams.length, 'team', 'teams') }} total).
                    </span>
                    <span v-else>
                        You have {{ me.teams.length }} {{ pluralise(me.teams.length, 'team', 'teams') }} looking for a game.
                    </span>
                </span>
                <a class="chooseteamslink" href="#" @click.prevent="showTeams">Choose teams</a>
                <a class="settingslink" href="#" @click.prevent="openModal('SETTINGS', {})">Settings</a>
            </div>
            <teamcards
                :selected-own-team-id="selectedOwnTeam ? selectedOwnTeam.id : 0"
                :my-teams="me.teams"
                :blackbox-user-activated="blackboxUserActivated"
                @select="selectTeam"></teamcards>
            <div id="offers">
                <blackbox
                    v-if="featureFlags.blackbox"
                    :is-dev-mode="isDevMode"
                    :blackbox-team-count="blackboxTeamCount"
                    :blackbox="matchesAndTeamsState.blackbox"
                    :last-round-game-count="lastBlackboxRoundGameCount"
                    :blackbox-draw-result="blackboxDrawResult"
                    @activated="handleBlackboxActivation"
                    @deactivated="handleBlackboxDeactivation"
                    @open-modal="openModal"
                    @blackbox-draw-result-dismiss="continueAfterLaunch"></blackbox>

                <offers
                    :is-dev-mode="isDevMode"
                    :fade-out="isLockedForBlackboxDraw"
                    :matches="matchesAndTeamsState.matches"
                    :matches-last-updated="matchesAndTeamsStateLastUpdated"
                    :offers="offers"
                    :coach-name="coachName"
                    :my-teams="me.teams"
                    :hidden-coaches="userSettings ? userSettings.hiddenCoaches : []"
                    :audio-enabled="userSettings ? userSettings.audio : true"
                    :start-dialog-offer-is-active="startDialogOffer !== null"
                    @hide-match="handleHideMatch"
                    @open-modal="openModal"
                    @show-dialog="handleShowDialog"
                    @launch-game="handleLaunchGame"
                    @download-jnlp="handleDownloadJnlp"
                    @scheduling-error="handleSchedulingError"
                    @blackbox-download-jnlp-id="handleBlackboxDownloadJnlpId"></offers>
            </div>
            <div id="opponents">
                <blackboxjoiningdraw
                    v-if="blackboxJoiningDraw.previousRoundTimestamp !== null"
                    :joining-draw="blackboxJoiningDraw"
                    :raw-round-history="rawBlackboxRoundHistory"
                    :coach-name="coachName"
                    @close="continueAfterLaunch"></blackboxjoiningdraw>

                <selectedownteam
                    :team="selectedOwnTeam"
                    :teamSettingsEnabled="featureFlags.teamSettings"
                    :blackbox-user-activated="blackboxUserActivated"
                    :fade-out="isLockedForBlackboxDraw"
                    @deselect-team="deselectTeam"
                    @open-modal="openModal"></selectedownteam>

                <opponents
                    :is-dev-mode="isDevMode"
                    :fade-out="isLockedForBlackboxDraw"
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
                    @opponents-updated="handleOpponentsUpdated"
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

        <teamsettings
            :is-dev-mode="isDevMode"
            :team="modalTeamSettingsTeam"
            @close-modal="closeModal"></teamsettings>

        <blackboxroundhistorymodal
            :is-open="modalBlackboxRoundHistory"
            :raw-round-history="rawBlackboxRoundHistory"
            :coach-name="coachName"
            @close-modal="closeModal"></blackboxroundhistorymodal>

        <stateupdatespaused
            :paused="stateUpdatesArePaused && !backendVersionRequiresRefresh"
            @continue-session="handleContinueSession"></stateupdatespaused>

        <backendversionrefresh
            :refresh-required="backendVersionRequiresRefresh"></backendversionrefresh>
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
import BackendVersionRefreshComponent from "./components/BackendVersionRefresh.vue";
import BlackboxJoiningDrawComponent from "./components/BlackboxJoiningDraw.vue";
import BlackboxRoundHistoryModalComponent from "./components/BlackboxRoundHistoryModal.vue";
import IBackendApi from "./include/IBackendApi";
import GameFinderHelpers from "./include/GameFinderHelpers";
import { Blackbox, BlackboxDrawResult, Coach, UserSettings } from "./include/Interfaces";
import { AxiosError } from "axios";

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
        'stateupdatespaused': StateUpdatesPausedComponent,
        'backendversionrefresh': BackendVersionRefreshComponent,
        'blackboxjoiningdraw': BlackboxJoiningDrawComponent,
        'blackboxroundhistorymodal': BlackboxRoundHistoryModalComponent,
    },
    watch: {
        'matchesAndTeamsState.blackbox.status'(newVal, oldVal) {
            if (newVal === 'Paused') {
                // @ts-ignore
                this.refreshBlackboxRoundHistory();
            }
        },
    }
})
export default class GameFinder extends Vue {
    private backendVersion: number | null = null;
    private backendVersionRequiresRefresh: boolean = false;

    public isDevMode: boolean = false;
    private backendApi: IBackendApi;

    public coachName: string | null = null;
    public display: 'LFG' | 'TEAMS' | 'TEAMS_ACTIVATING' = 'LFG';
    public featureFlags = {blackbox: true, teamSettings: false};
    public userSettings: UserSettings | null = null;

    public secondsBetweenGetStateCalls: number = 1;
    public stateUpdatesArePaused: boolean = false;
    public stateUpdateErrorMessage: string | null = null;
    public schedulingErrorMessage: string | null = null;

    public startDialogOffer:any = null;
    public launchGameOffer:any = null;
    public downloadJnlpOffer:any = null;
    public allowRejoinAfterDownload: boolean = false;

    public selectedOwnTeam:any = null;
    public me:any = { teams: [] };

    public opponentMap: Map<string, any> = new Map<string, any>();
    public offerableOpponentTeamIds: number[] = [];
    private readHistory: Map<number, number[]> = new Map<number, number[]>();

    // the offers property is primarily managed by the OffersComponent, they're held here and passed to OffersComponent as a prop
    public offers:any = [];
    public matchesAndTeamsState: {matches: any[], teams: any[], blackbox: Blackbox | null} = {matches: [], teams: [], blackbox: null};
    public matchesAndTeamsStateLastUpdated: number = 0;

    public lastActiveTimestamp: number = 0;

    public rawBlackboxRoundHistory: {lastUpdated: number, rawRounds: any[]} = {lastUpdated: 0, rawRounds: []};
    public blackboxJoiningDraw: {
        displaySecondsUntilDraw: number,
        previousRoundTimestamp: number | null,
        drawnRoundTimestamp: number | null,
        downloadJnlpId: number | null,
    } = {
        displaySecondsUntilDraw: 0,
        previousRoundTimestamp: null,
        drawnRoundTimestamp: null,
        downloadJnlpId: null,
    };
    public blackboxMatchPreviouslyScheduled: boolean = false;

    public modalRosterSettings: {isMyTeam: boolean, displayTeam: any, ownTeamsOfferable: any[]} | null = null;
    public modalTeamSettingsTeam: any | null = null;
    public modalSettingsShow: boolean = false;
    public modalBlackboxRoundHistory: boolean = false;

    async beforeMount() {
        const appElement = document.getElementById("vuecontent");
        this.coachName = appElement.getAttribute("coach");
        this.isDevMode = appElement.hasAttribute("dev-mode-on");
        this.backendApi = GameFinderHelpers.getBackendApi(this.isDevMode);
    }

    async mounted() {
        await this.activate();

        this.updateLastActiveTimestamp();

        this.userSettings = await this.backendApi.getUserSettings();

        this.refresh();

        document.addEventListener('click', this.onOuterModalClick);

        document.getElementById("gamefinder").addEventListener('click', this.updateLastActiveTimestamp);

        this.beginGetStatePolling();

        await this.refreshBlackboxRoundHistory();

        this.blackboxMatchPreviouslyScheduled = this.getBlackboxJnlpIdFromLatestDraw() ? true : false;
    }

    public updateLastActiveTimestamp() {
        this.lastActiveTimestamp = Date.now();
    }

    public isStatePollingAllowed(): boolean {
        const msUntilStateDelayUnacceptable = 15 * 1000;
        const stateDelayUnacceptable = this.matchesAndTeamsStateLastUpdated !== 0 && this.matchesAndTeamsStateLastUpdated < Date.now() - msUntilStateDelayUnacceptable;

        const msUserActivityDelayUnacceptable = 30 * 60000;
        const userActivityDelayUnacceptable = this.lastActiveTimestamp !== 0 && this.lastActiveTimestamp < Date.now() - msUserActivityDelayUnacceptable;

        return stateDelayUnacceptable === false && userActivityDelayUnacceptable === false;
    }

    public async beginGetStatePolling() {
        await this.getState();

        const getStateWithSetTimeout = async () => {
            let enableGetStatePolling = true;

            const launchGameOfferTimedOut = this.launchGameOffer && this.launchGameOffer.timeRemaining <= 1000;
            const downloadJnlpOfferTimedOut = this.downloadJnlpOffer && this.downloadJnlpOffer.timeRemaining <= 1000;

            if (launchGameOfferTimedOut || downloadJnlpOfferTimedOut) {
                this.allowRejoinAfterDownload = true;
                enableGetStatePolling = false;
            } else if (this.blackboxJoiningDraw.drawnRoundTimestamp !== null && this.blackboxJoiningDraw.downloadJnlpId !== null) {
                enableGetStatePolling = false;
            } else if (! this.isStatePollingAllowed()) {
                this.stateUpdatesArePaused = true;
                enableGetStatePolling = false;
            }

            if (this.backendVersionRequiresRefresh) {
                enableGetStatePolling = false;
            }

            try {
                if (enableGetStatePolling) {
                    await this.getState();
                }
                this.stateUpdateErrorMessage = null;
            } catch (error) {
                if (this.backendApi.isAxiosError((error as Error)) && (error as AxiosError).response.status === 400) {
                    // 400 status code means the state has rejected our request as the version has changed, we need to force a reload.
                    this.backendVersionHasChanged();
                } else {
                    setTimeout(() => {
                        this.stateUpdateErrorMessage = (error as Error).name + ': ' + (error as Error).message;
                    }, 1000);
                }
            }

            setTimeout(getStateWithSetTimeout, this.secondsBetweenGetStateCalls*1000);
        };

        getStateWithSetTimeout();
    }

    public async getState()
    {
        if (this.backendVersion === null) {
            return;
        }

        const matchesAndTeamsState = await this.backendApi.getState(this.backendVersion);

        this.refreshMyTeams(matchesAndTeamsState);
        this.refresh();
        this.matchesAndTeamsState = matchesAndTeamsState;
        this.matchesAndTeamsStateLastUpdated = Date.now();
        this.refreshBlackbox();
    }

    private async activate() {
        const backendVersion = await this.backendApi.activate();
        if (this.backendVersion === null) {
            // this.backendVersion starts as null, so this only gets set on first call to activate
            this.backendVersion = backendVersion;
        }
    }

    private backendVersionHasChanged() {
        this.backendVersionRequiresRefresh = true;
        setTimeout(() => {
            window.location.reload();
        }, 30000);
    }

    private refreshMyTeams(matchesAndTeamsState: {matches: any[], teams: any[]})
    {
        let myTeams: any[] | null = null;
        for(const coachTeams of matchesAndTeamsState.teams) {
            const coachName: string = coachTeams.name;
            if (coachName === this.coachName) {
                myTeams = coachTeams.teams;
                break;
            }
        }

        if (myTeams === null) {
            if (this.launchGameOffer === null) {
                // reactivate to recover from a backend restart (only if a game has not been launched)
                this.activate();
            }
            return;
        }

        if (myTeams.length === 0) {
            this.me.teams = [];
            return;
        }

        Util.applyDeepDefaults(myTeams, [{
            allow: [],
            hasUnreadItems: false
        }], this.$set);

        const offerableOpponentTeamIds = [];

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
                            if (! offerableOpponentTeamIds.includes(opponentTeamId)) {
                                offerableOpponentTeamIds.push(opponentTeamId);
                            }
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
        this.offerableOpponentTeamIds = offerableOpponentTeamIds;
    }

    private refreshBlackbox() {
        if (this.blackboxUserActivated) {
            this.selectedOwnTeam = null;
        }

        this.refreshBlackboxJoiningDraw();
    }

    public async showLfg() {
        await this.activate();
        await this.getState();

        // always select if only 1 team (and not activated for blackbox)
        if (this.me.teams.length === 1 && this.blackboxUserActivated === false) {
            const onlyTeam = this.me.teams[0];
            this.selectedOwnTeam = onlyTeam;
        }

        this.display = 'TEAMS_ACTIVATING';
    }

    public handleOpponentsUpdated() {
        if (this.display === 'TEAMS_ACTIVATING') {
            this.display = 'LFG';
            setTimeout(() => {
                window.scroll({
                    top: 0,
                    behavior: 'smooth'
                });
            }, 1000);
        }
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
            if (!Array.isArray(team.allow) || team.allow.length === 0) {
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
                    if (this.userSettings.showUnofferableTeams || this.me.teams.length === 0) {
                        oppTeam.visible = true;
                    } else {
                        oppTeam.visible = this.offerableOpponentTeamIds.includes(oppTeam.id);
                    }
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
        if (this.blackboxUserActivated) {
            return;
        }

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
        if (this.isLockedForBlackboxDraw) {
            return;
        }
        if (startDialogOffer !== null) {
            this.closeModal();
        }
        this.startDialogOffer = startDialogOffer;
    }

    public handleLaunchGame(launchGameOffer: any | null): void {
        if (this.isLockedForBlackboxDraw) {
            return;
        }
        if (launchGameOffer !== null) {
            this.launchGameOffer = launchGameOffer;
            if (this.blackboxUserActivated) {
                this.backendApi.blackboxDeactivate();
            }
        }
    }

    public handleDownloadJnlp(downloadJnlpOffer: any | null): void {
        if (this.isLockedForBlackboxDraw) {
            return;
        }
        if (downloadJnlpOffer !== null) {
            this.downloadJnlpOffer = downloadJnlpOffer;
        }
    }

    public handleSchedulingError(schedulingErrorMessage: string | null): void {
        if (this.isLockedForBlackboxDraw) {
            return;
        }
        if (schedulingErrorMessage !== null) {
            this.schedulingErrorMessage = schedulingErrorMessage;
        }
    }

    public handleBlackboxDownloadJnlpId(blackboxDownloadJnlpId: number): void {
        if (!this.isLockedForBlackboxDraw) {
            return;
        }
        this.blackboxJoiningDraw.downloadJnlpId = blackboxDownloadJnlpId;
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
            document.querySelector('.rosterouter, .settingsouter, .teamsettingsouter, .blackboxroundhistoryouter'),
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
        } else if (modalName === 'BLACKBOX_ROUNDS') {
            this.modalBlackboxRoundHistory = true;
        }
    }

    private getModalRosterSettings(rosterTeam: any): {isMyTeam: boolean, displayTeam: any, ownTeamsOfferable: any[], hasActivatedTeams: boolean} {
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
            ownTeamsOfferable: ownTeamsOfferable,
            hasActivatedTeams: this.me.teams.length > 0
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
        this.modalBlackboxRoundHistory = false;
    }

    public getLargeTeamLogoUrl(team: any): string {
        return GameFinderHelpers.getTeamLogoUrl(team, false);
    }

    public async handleContinueSession() {
        await this.activate();
        await this.getState();
        this.stateUpdatesArePaused = false;
    }

    public async continueAfterLaunch() {
        this.launchGameOffer = null;
        this.downloadJnlpOffer = null;
        this.allowRejoinAfterDownload = false;
        this.schedulingErrorMessage = null;

        this.blackboxReset();

        await this.activate();
        await this.getState();
        this.stateUpdatesArePaused = false;
    }

    public blackboxReset() {
        this.blackboxJoiningDraw = {
            displaySecondsUntilDraw: 0,
            previousRoundTimestamp: null,
            drawnRoundTimestamp: null,
            downloadJnlpId: null,
        };
        this.blackboxMatchPreviouslyScheduled = false;
        this.backendApi.blackboxDeactivate();
    }

    public get blackboxTeamCount(): number {
        return this.me.teams.filter(GameFinderPolicies.teamCanJoinBlackboxDraw).length
    }

    public get blackboxUserActivated(): boolean {
        if (this.matchesAndTeamsState.blackbox === null) {
            return false;
        }

        return this.matchesAndTeamsState.blackbox.status === 'Active' && this.matchesAndTeamsState.blackbox.userActivated;
    }

    public get isLockedForBlackboxDraw(): boolean {
        return this.blackboxJoiningDraw.previousRoundTimestamp !== null;
    }

    public handleBlackboxActivation(): void {
        this.backendApi.blackboxActivate();
    }

    public handleBlackboxDeactivation(): void {
        this.blackboxReset();
    }

    public async refreshBlackboxRoundHistory() {
        this.rawBlackboxRoundHistory = {
            lastUpdated: Date.now(),
            rawRounds: await this.backendApi.blackboxRoundHistory()
        };
    }

    public get lastBlackboxRoundGameCount(): {round: string, count: number} {
        if (this.rawBlackboxRoundHistory === null || this.rawBlackboxRoundHistory.rawRounds.length === 0) {
            return {
                round: '00:00',
                count: 0,
            };
        }
        let round = this.rawBlackboxRoundHistory.rawRounds[0].round;
        round = round.slice(11, 16);
        return {
            round: round,
            count: this.rawBlackboxRoundHistory.rawRounds[0].data.ScheduledMatches.length,
        }
    }

    public refreshBlackboxJoiningDraw(): void {
        if (
            this.blackboxUserActivated
            && this.blackboxJoiningDraw.previousRoundTimestamp === null
            && this.matchesAndTeamsState.blackbox.status === 'Active'
            && this.matchesAndTeamsState.blackbox.secondsRemaining <= 30
        ) {
            // the UI will now be locked for the blackbox draw
            this.blackboxJoiningDraw.previousRoundTimestamp = this.rawBlackboxRoundHistory.lastUpdated;
        } else if (
            this.blackboxJoiningDraw.previousRoundTimestamp !== null
            && this.blackboxJoiningDraw.drawnRoundTimestamp === null
            && this.blackboxJoiningDraw.previousRoundTimestamp !== this.rawBlackboxRoundHistory.lastUpdated
        ) {
            // the results of the latest draw can now be shown
            this.blackboxJoiningDraw.drawnRoundTimestamp = this.rawBlackboxRoundHistory.lastUpdated;
        }

        // update seconds remaining, but only if we're in the pre-draw (previous round)
        if (this.blackboxJoiningDraw.previousRoundTimestamp === this.rawBlackboxRoundHistory.lastUpdated) {
            if (this.matchesAndTeamsState.blackbox.status === 'Active' && this.matchesAndTeamsState.blackbox.secondsRemaining > 0) {
                this.blackboxJoiningDraw.displaySecondsUntilDraw = this.matchesAndTeamsState.blackbox.secondsRemaining;
            } else {
                this.blackboxJoiningDraw.displaySecondsUntilDraw = 0;
            }
        }
    }

    public get blackboxDrawResult(): BlackboxDrawResult {
        if (this.blackboxJoiningDraw.drawnRoundTimestamp !== null && this.blackboxJoiningDraw.downloadJnlpId !== null) {
            return 'SCHEDULED';
        } else if (this.blackboxJoiningDraw.drawnRoundTimestamp !== null) {
            return 'NOT_SCHEDULED';
        } else if (this.blackboxMatchPreviouslyScheduled) {
            return 'PREVIOUSLY_SCHEDULED';
        } else {
            return 'NOT_APPLICABLE';
        }
    }

    public getBlackboxJnlpIdFromLatestDraw(): number | null {
        if (this.rawBlackboxRoundHistory === null || this.rawBlackboxRoundHistory.rawRounds.length === 0) {
            return null;
        }
        const rawLatestRound = this.rawBlackboxRoundHistory.rawRounds[0];
        let coachTeamIdsLookup = [];
        for (const coach of rawLatestRound.teamData) {
            if (coach.coach === this.coachName) {
                coachTeamIdsLookup = Object.keys(coach.teams).map((teamId) => parseInt(teamId) );
                break;
            }
        }
        for (const scheduledMatch of rawLatestRound.data.ScheduledMatches) {
            if (coachTeamIdsLookup.includes(scheduledMatch.Team1.TeamId)) {
                return scheduledMatch.Team1.TeamId;
            }
            if (coachTeamIdsLookup.includes(scheduledMatch.Team2.TeamId)) {
                return scheduledMatch.Team2.TeamId;
            }
        }
        return null;
    }

    public pluralise(quantity: number, singular: string, plural: string): string {
        return GameFinderHelpers.pluralise(quantity, singular, plural);
    }
}
</script>