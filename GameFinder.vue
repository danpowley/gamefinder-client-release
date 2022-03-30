<template>
    <div id="gamefinder">
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
            <teamcards :my-teams="me.teams" @select="selectTeam"></teamcards>
            <div id="offers">
                <blackbox
                    v-if="featureFlags.blackbox"
                    :available="blackboxData.available"
                    :chosen="blackboxData.chosen"></blackbox>

                <offers
                    :is-dev-mode="isDevMode"
                    :offers="offers"
                    :coach-name="coachName"
                    :my-teams="me.teams"
                    :hidden-coaches="hiddenCoaches"
                    @hide-match="handleHideMatch"
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
                    :opponent-map="opponentMap"
                    :opponents-refresh-required="opponentsRefreshRequired"
                    :selected-own-team="selectedOwnTeam"
                    :selected-own-team-offered-team-ids="selectedOwnTeamOfferedTeamIds"
                    :hidden-coach-count="hiddenCoaches.length"
                    @refresh="refresh"
                    @hide-match="handleHideMatch"
                    @hide-coach="handleHideCoach"
                    @opponents-refreshed="setOpponentsRefreshed"
                    @open-modal="openModal"></opponents>
            </div>
        </div>

        <roster
            :is-dev-mode="isDevMode"
            :settings="modalRosterSettings"
            @close-modal="closeModal"></roster>

        <settings
            :is-open="modalSettingsShow"
            :hidden-coaches="hiddenCoaches"
            @unhide-coach="handleUnhideCoach"
            @close-modal="closeModal"></settings>

        <teamsettings v-if="featureFlags.teamSettings" :team="modalTeamSettingsTeam" @close-modal="closeModal"></teamsettings>
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
import IBackendApi from "./include/IBackendApi";
import GameFinderHelpers from "./include/GameFinderHelpers";

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
        'opponents': OpponentsComponent
    }
})
export default class GameFinder extends Vue {
    public isDevMode: boolean = false;
    private backendApi: IBackendApi;

    public coachName: string | null = null;
    public display: 'LFG' | 'TEAMS' | 'NONE' = 'LFG';
    public featureFlags = {blackbox: false, teamSettings: false};

    public startDialogOffer:any = null;
    public launchGameOffer:any = null;

    public selectedOwnTeam:any = null;
    public me:any = { teams: [] };

    public opponentMap: Map<string, any> = new Map<string, any>();
    public opponentsRefreshRequired: boolean = false;
    private readHistory: Map<number, number[]> = new Map<number, number[]>();

    // the offers property is primarily managed by the OffersComponent, they're held here and passed to OffersComponent as a prop
    public offers:any = [];

    public blackboxData: {available: number, chosen: number} = {available: 0, chosen: 0};

    public modalRosterSettings: {isMyTeam: boolean, displayTeam: any, ownTeamsOfferable: any[]} | null = null;
    public modalTeamSettingsTeam: any | null = null;
    public modalSettingsShow: boolean = false;

    public hiddenCoaches: {id: number, name: string}[] = [];

    async beforeMount() {
        const appElement = document.getElementById("vuecontent");
        this.coachName = appElement.getAttribute("coach");
        this.isDevMode = appElement.hasAttribute("dev-mode-on");
        this.backendApi = GameFinderHelpers.getBackendApi(this.isDevMode);
    }

    async mounted() {
        await this.activate();

        this.refresh();

        document.addEventListener('click', this.onOuterModalClick)
    }

    public async activate() {
        await this.backendApi.activate();
        const teams = await this.backendApi.activeTeams();
        const activeTeams = teams;

        Util.applyDeepDefaults(activeTeams, [{
            selected: false,
            allow: [],
            hasUnreadItems: false,
            hiddenMatches: []
        }], this.$set);

        activeTeams.sort(GameFinderPolicies.sortTeamByDivisionNameLeagueNameTeamName);
        this.me.teams = activeTeams;
    }

    public async showLfg() {
        this.display = 'NONE';

        await this.activate();

        // always select if only 1 team
        if (this.me.teams.length === 1) {
            const onlyTeam = this.me.teams[0];
            this.selectedOwnTeam = onlyTeam;
            onlyTeam.selected = true;
        }

        this.refresh();

        this.setOpponentsRefreshRequired();

        this.display = 'LFG';
    }

    public async showTeams() {
        this.display = 'TEAMS';
    }

    private refresh() {
        this.refreshOwnTeamSelectionSettings();
        this.refreshOwnTeamsAllowedSettings();
        this.refreshOwnTeamsUnreadSettings();
        this.refreshOpponentVisibility();
    }

    private refreshOwnTeamSelectionSettings() {
        let ownTeamSelected = false;

        // Update own team selection
        for (let myTeam of this.me.teams) {
            myTeam.selected = this.selectedOwnTeam && (myTeam.id == this.selectedOwnTeam.id);
            if (myTeam.selected) {
                ownTeamSelected = true;
            }
        }

        // No visible own team selected, so we make sure the state reflects that
        if (! ownTeamSelected) {
            this.selectedOwnTeam = null;
        }
    }

    private refreshOwnTeamsAllowedSettings() {
        for (let team of this.me.teams) {
            team.allow = [];
            this.opponentMap.forEach(opponent => {
                if (! this.isCoachHidden(opponent.id)) {
                    for (let oppTeam of opponent.teams) {
                        if (GameFinderPolicies.isMatchAllowed(team, oppTeam)) {
                            team.allow.push(oppTeam.id);
                        }
                    }
                }
            });
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
            for (const coachDetails of this.hiddenCoaches) {
                if (coachDetails.id === opponent.id) {
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
        this.removeOfferFromOffers(myTeamId, opponentTeamId);
        this.addOpponentTeamIdToHiddenMatchesTempUntilBackendSupport(myTeamId, opponentTeamId);
        this.refreshOwnTeamsAllowedSettings();
        this.refreshOpponentVisibility();
        this.backendApi.cancelOffer(myTeamId, opponentTeamId);
    }

    private removeOfferFromOffers(myTeamId: number, opponentTeamId: number): void
    {
        const index = this.offers.findIndex((o) => o.home.id === myTeamId && o.away.id === opponentTeamId);
        if (index !== -1) {
            this.offers.splice(index, 1);
        }
    }

    private addOpponentTeamIdToHiddenMatchesTempUntilBackendSupport(myTeamId: number, opponentTeamId: number): void {
        for (const myTeam of this.me.teams) {
            if (myTeam.id === myTeamId) {
                myTeam.hiddenMatches.push({opponentTeamId: opponentTeamId, hiddenDate: Date.now()});;
            }
        }
    }

    public handleHideCoach(id: number, name: string): void {
        this.hiddenCoaches.push({id: id, name: name});
        this.refreshOwnTeamsAllowedSettings();
        this.refreshOpponentVisibility();
    }

    public handleUnhideCoach(id: number): void {
        if (! this.isCoachHidden(id)) {
            return;
        }
        this.hiddenCoaches.splice(this.getHiddenCoachIndex(id), 1);
        this.refreshOwnTeamsAllowedSettings();
        this.refreshOpponentVisibility();
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
        return this.hiddenCoaches.findIndex((coachDetails) => coachDetails.id === id);
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

    public setOpponentsRefreshRequired() {
        this.opponentsRefreshRequired = true;
    }

    public setOpponentsRefreshed() {
        this.opponentsRefreshRequired = false;
    }

    public getLargeTeamLogoUrl(team: any): string {
        return GameFinderHelpers.getTeamLogoUrl(team, false);
    }
}
</script>