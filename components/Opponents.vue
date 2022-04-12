<template>
    <div id="opponentslist" @mouseenter="setUiUpdatesPaused(true)" @mouseleave="setUiUpdatesPaused(false)">
        <div class="expandcollapseall" v-show="visibleOpponents.length > 0"><a href="#" @click.prevent="expandAllOpponents()">Expand</a> <a href="#" @click.prevent="collapseAllOpponents()">Collapse</a></div>
        <div>
            <strong>{{ isOwnTeamSelected ? 'Opponents filtered by selected team.' : 'All opponents on Gamefinder' }}</strong>
            <span
                v-show="uiUpdatesPaused"
                class="frozentag"
                title="New opponents won't be added/removed until you move your mouse away from this area. This is to prevent the page moving whilst you browse opponents."
                >Frozen</span>
        </div>
        <div v-show="visibleOpponents.length === 0">No opponents available.</div>
        <div v-for="opponent in visibleOpponents" :key="opponent.id" class="opponent">
            <div class="coach" :class="{fadeout: latestHiddenCoachId === opponent.id}">
                <a class="disclosure" @click.prevent="expandOpponent(opponent)" href="#">
                    <span class="showhideicon" v-if="isExpanded(opponent)">&#x25bc;</span>
                    <span class="showhideicon" v-else>&#x25b6;</span>
                    <span class="teamcount" title="Teams listed for this opponent">{{ opponent.teams.filter((o) => o.visible).length }}</span>
                    {{ opponent.name }}
                </a>
                <span class="ranking">
                    {{ opponent.ranking }}
                </span>
                <span v-show="! isExpanded(opponent)"><a href="#" class="hidecoach" @click.prevent="hideCoach({id: opponent.id, name: opponent.name, ranking: opponent.ranking})">hide</a></span>
            </div>
            <div v-show="isExpanded(opponent)">
                <template v-for="oppTeam in opponent.teams" v-if="oppTeam.visible && ! inHideMatchQueue(oppTeam.id, 300)">
                    <div :key="oppTeam.id">
                        <div v-if="!isOwnTeamSelected && opponent.teamsShowDivisionLeagueHeader['team' + oppTeam.id].showDivisionHeader" class="divisionheader">{{ oppTeam.division }}</div>
                        <div v-if="!isOwnTeamSelected && opponent.teamsShowDivisionLeagueHeader['team' + oppTeam.id].showLeagueHeader" class="leagueheader">League teams for <strong>{{ oppTeam.league.name }}</strong></div>
                        <div class="team" :class="{wholeteamclickable: ! isOwnTeamSelected, fadeout: inHideMatchQueue(oppTeam.id, null)}" @click.prevent="() => {! isOwnTeamSelected ? openModal('ROSTER', {team: oppTeam}): null;}">
                            <div class="logo">
                                <img :src="getTeamLogoUrl(oppTeam)" />
                            </div>
                            <div class="details">
                                <div class="name">
                                    <span :class="{nameoffhover: isOwnTeamSelected}">{{ abbreviate(oppTeam.name, 55) }}</span>
                                    <a v-if="isOwnTeamSelected" class="nameonhover" href="#" @click.prevent="openModal('ROSTER', {team: oppTeam})">{{ abbreviate(oppTeam.name, 55) }}</a>
                                </div>
                                <div class="info">
                                    <span v-show="isOfferedBySelectedOwnTeam(oppTeam)" class="offeredtag">Offered</span>
                                    <span title="Seasons and games played">S{{ oppTeam.seasonInfo.currentSeason }}:G{{ oppTeam.seasonInfo.gamesPlayedInCurrentSeason }}</span> {{ oppTeam.teamValue / 1000 }}k {{ oppTeam.roster.name }}
                                </div>
                            </div>
                            <div class="links">
                                <div>
                                    <template v-if="isOwnTeamSelected">
                                        <template v-if="isOfferedBySelectedOwnTeam(oppTeam)">
                                            <span>Offered / </span>
                                        </template>
                                        <template v-else>
                                            <a href="#" @click.prevent="sendOffer(oppTeam)">Send Offer</a> / 
                                        </template>
                                        <a href="#" @click.prevent="hideMatch(oppTeam.id)">Hide Match</a>
                                    </template>
                                </div>
                            </div>
                            <div v-if="isOwnTeamSelected" class="selectedownteam">
                                <div class="details">
                                    <div class="name">
                                        {{ abbreviate(selectedOwnTeam.name, 20) }}
                                    </div>
                                    <div class="info">
                                        {{ selectedOwnTeam.roster.name }} {{ selectedOwnTeam.teamValue / 1000 }}k
                                    </div>
                                </div>
                                <div class="logo">
                                    <img :src="getTeamLogoUrl(selectedOwnTeam)" />
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </div>
        <div v-show="hiddenCoachCount > 0" class="hiddencoachcount"><a href="#" class="muted" @click.prevent="openModal('SETTINGS', {})">+{{ hiddenCoachCount }} total hidden coaches</a></div>
    </div>  
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';
import { Util } from '../../../core/util';
import GameFinderHelpers from '../include/GameFinderHelpers';
import GameFinderPolicies from "../include/GameFinderPolicies";
import IBackendApi from "../include/IBackendApi";
import { Coach } from "../include/Interfaces";

@Component({
    props: {
        isDevMode: {
            type: Boolean,
            required: true
        },
        coachName: {
            type: String,
            required: true
        },
        matchesAndTeamsState: {
            type: Object,
            required: true
        },
        matchesAndTeamsStateLastUpdated: {
            type: Number,
            required: true
        },
        opponentMap: {
            type: Map,
            required: true
        },
        selectedOwnTeam: {
            validator: function (team) {
                return typeof team === 'object' || team === null;
            }
        },
        selectedOwnTeamOfferedTeamIds: {
            type: Array,
            required: true
        },
        hiddenCoachCount: {
            type: Number,
            required: true
        }
    },
    watch: {
        matchesAndTeamsStateLastUpdated: function () {
            // @ts-ignore: Property 'getOpponentsFromMatchesAndTeamsState' does not exist on type 'Vue'.
            return this.getOpponentsFromMatchesAndTeamsState();
        }
    }
})
export default class OpponentsComponent extends Vue {
    private backendApi: IBackendApi | null = null;
    private uiUpdatesPaused: boolean = false;

    public opponents:any = {};
    public pendingOpponents: any = [];
    private opponentsNeedUpdate: boolean;
    public expandedForAllOpponents: number[] = [];

    // allow UI to update when offers are made, but before the main selectedOwnTeamOfferedTeamIds prop array has updated
    private recentOffers: {myTeamId: number, opponentTeamId: number, offerDate: number}[] = [];

    public latestHiddenCoachId: number | null = null;
    public hideMatchQueue: {ownTeamId: number, opponentTeamId: number, hiddenDate: number, emitted: boolean}[] = [];

    async mounted() {
        this.backendApi = GameFinderHelpers.getBackendApi(this.$props.isDevMode);
        setInterval(this.processOpponents, 100);
    }

    private get isOwnTeamSelected(): boolean {
        return this.$props.selectedOwnTeam !== null;
    }

    private async getOpponentsFromMatchesAndTeamsState() {
        const data = this.$props.matchesAndTeamsState.teams;

        Util.applyDeepDefaults(data, [{
            visibleTeams: 0,
            expanded: false,
            visible: true,
            teams: [{
                visible: false,
                selected: false
            }]
        }], this.$set);

        // Remove logged in coach
        for(let i = data.length - 1; i >= 0; i--) {
            if (data[i].name === this.$props.coachName) {
                data.splice(i, 1);
            }
        }

        this.pendingOpponents = data;
        this.opponentsNeedUpdate = true;
        this.processOpponents();
    }

    private processOpponents() {
        this.processHideMatchQueue();

        // Process updated opponent list
        if (this.opponentsNeedUpdate) {
            this.opponentsNeedUpdate = false;
            if (! this.uiUpdatesPaused) {
                // Mark all current opponents as dirty
                this.$props.opponentMap.forEach((o, k) => {
                    this.$props.opponentMap.get(k).dirty = true;
                });

                let r = {};
                for (let p of this.pendingOpponents) {
                    r[p.name] = p;
                }

                for (let k in r) {
                    if (! this.$props.opponentMap.has(k)) {
                        // New coach
                        r[k].dirty = false;
                        this.$props.opponentMap.set(k, r[k]);
                    } else {
                        // Coach is already on the list, so make sure it's kept there.
                        let opp = this.$props.opponentMap.get(k)
                        opp.dirty = false;

                        // Update teams

                        // Generate map and mark as dirty
                        let teamMap = {};
                        for (let t in opp.teams) {
                            let team = opp.teams[t];
                            team.dirty = true;
                            teamMap[team.id] = team;
                        }

                        r[k].teams.forEach(t => {
                            if (teamMap[t.id] == undefined) {
                                // new team, add it
                                teamMap[t.id] = t;
                                t.dirty = false;
                            } else {
                                // Existing team, mark it as clean
                                teamMap[t.id].dirty = false;
                            }
                        });

                        // Remove teams that are no longer on the list
                        for (let i=opp.teams.length - 1; i>=0; i--) {
                            if (opp.teams[i].dirty) {
                                delete teamMap[opp.teams[i].id];
                                opp.teams.splice(i, 1);
                            } else {
                                // Need to update the stats.. Might have changed
                                let existingTeam = opp.teams[i];
                                existingTeam.teamValue = teamMap[existingTeam.id].teamValue;
                                existingTeam.gamesPlayed = teamMap[existingTeam.id].gamesPlayed;

                                // Remove team from pending list
                                delete teamMap[existingTeam.id];
                            }
                        }

                        // Add new teams.
                        for (let k in teamMap) {
                            opp.teams.push(teamMap[k]);
                        }
                    }
                }

                // Remove opponent coaches that aren't present anymore
                this.$props.opponentMap.forEach((o, key) => {
                    if (o.dirty) {
                        this.$props.opponentMap.delete(key);
                    }
                });

                // Store collapsed state of coaches
                const collapsed: Array<string> = [];
                for (let o of this.opponents) {
                    if (! o.expanded) {
                        collapsed.push(o.name);
                    }
                }

                // Generate new opponents structure
                let newOpponents = [];
                this.$props.opponentMap.forEach(o => {
                    newOpponents.push(o);
                    // Expand unless the coach was explicitly collapsed (allow new coaches to be expanded by default)
                    o.expanded = collapsed.indexOf(o.name) === -1;
                });

                this.opponents = newOpponents;
                this.pendingOpponents = [];
                this.sortOpponents();
                this.$emit('refresh');
                this.recentOffers = [];

                // clear the temporary latestHiddenCoachId so it doesn't keep hiding a coach that is visible again
                this.latestHiddenCoachId = null;
            }
        }        
    }

    private sortOpponents() {
        this.opponents.sort((a,b) => a.name.localeCompare(b.name));
        for (const opponent of this.opponents) {
            opponent.teams.sort(GameFinderPolicies.sortTeamByDivisionNameLeagueNameTeamName);
            opponent.teamsShowDivisionLeagueHeader = GameFinderHelpers.getTeamsShowDivisionLeagueHeader(opponent.teams);
        }
    }

    private processHideMatchQueue() {
        // items remain in queue for 60 seconds (keep UI accurate for very slow connections)
        const timeToKeepInQueue = 60000;
        // 'hide-match' event emitted after short delay, allow for CSS transitions
        const timeToDelayEmit = 300;

        const hideMatchQueue = this.hideMatchQueue;
        this.hideMatchQueue = [];
        for (const hiddenMatch of hideMatchQueue) {
            const timeSinceHidden = Math.floor((Date.now() - hiddenMatch.hiddenDate));
            if (timeSinceHidden < timeToKeepInQueue) {
                if (timeSinceHidden > timeToDelayEmit && hiddenMatch.emitted === false) {
                    hiddenMatch.emitted = true;
                    this.$emit('hide-match', hiddenMatch.ownTeamId, hiddenMatch.opponentTeamId);
                }
                this.hideMatchQueue.push(hiddenMatch);
            }
        }
    }

    public get visibleOpponents(): any[] {
        const visibleOpponents = [];
        for (const opponent of this.opponents) {
            if (! opponent.visible) {
                continue;
            }
            if (opponent.visibleTeams > 0) {
                visibleOpponents.push(opponent);
            }
        }
        return visibleOpponents;
    }

    public expandOpponent(opponent) {
        if (this.isOwnTeamSelected) {
            // We have selected a team, so we can use the property directly on the opponent.
            opponent.expanded = !opponent.expanded;
        } else {
            // No team selected, so we store the expanded state separately.
            let index = this.expandedForAllOpponents.indexOf(opponent.id);
            if (index !== -1) {
                this.expandedForAllOpponents.splice(index, 1);
            } else {
                this.expandedForAllOpponents.push(opponent.id);
            }
        }
    }

    public expandAllOpponents() {
        if (this.isOwnTeamSelected) {
            for (const visibleOpponent of this.visibleOpponents) {
                visibleOpponent.expanded = true;
            }
        } else {
            this.expandedForAllOpponents = Array.from(this.$props.opponentMap.values()).map((o:any) => o.id);
        }
    }

    public collapseAllOpponents() {
        if (this.isOwnTeamSelected) {
            for (const visibleOpponent of this.visibleOpponents) {
                visibleOpponent.expanded = false;
            }
        } else {
            this.expandedForAllOpponents = [];
        }
    }

    public isExpanded(opponent) {
        if (this.isOwnTeamSelected) {
            return opponent.expanded;
        } else {
            return this.expandedForAllOpponents.includes(opponent.id);
        }
    }

    public async sendOffer(team) {
        await this.backendApi.sendOffer(this.$props.selectedOwnTeam.id, team.id);
        this.recentOffers.push({myTeamId: this.$props.selectedOwnTeam.id, opponentTeamId: team.id, offerDate: Date.now()});
    }

    private hasRecentOffer(teamId) {
        for (const recentOfferDetails of this.recentOffers) {
            if (recentOfferDetails.offerDate > Date.now() - 3000) {
                if (recentOfferDetails.myTeamId === this.$props.selectedOwnTeam.id && recentOfferDetails.opponentTeamId === teamId) {
                    return true;
                }
            }
        }
        return false;
    }

    public isOfferedBySelectedOwnTeam(team) {
        if (this.hasRecentOffer(team.id)) {
            return true;
        }

        return this.$props.selectedOwnTeamOfferedTeamIds.includes(team.id);
    }

    public setUiUpdatesPaused(isPaused: boolean) {
        this.uiUpdatesPaused = isPaused;
    }

    public hideMatch(opponentTeamId) {
        if (! this.$props.selectedOwnTeam) {
            return;
        }

        this.hideMatchQueue.push({ownTeamId: this.$props.selectedOwnTeam.id, opponentTeamId: opponentTeamId, hiddenDate: Date.now(), emitted: false});
    }

    public inHideMatchQueue(opponentTeamId: number, hiddenForMilliseconds: number | null): boolean {
        if (! this.$props.selectedOwnTeam) {
            return false;
        }

        for (const hiddenMatch of this.hideMatchQueue) {
            if (hiddenMatch.ownTeamId === this.$props.selectedOwnTeam.id && hiddenMatch.opponentTeamId === opponentTeamId) {
                if (hiddenForMilliseconds === null) {
                    return true;
                }

                return (Date.now() - hiddenMatch.hiddenDate) >= hiddenForMilliseconds;
            }
        }

        return false;
    }

    public hideCoach(coach: Coach) {
        this.latestHiddenCoachId = coach.id;

        // delay emitting the event to give time for the CSS transition to run
        setTimeout(() => {
            this.$emit('hide-coach', coach);
        }, 500);
    }

    public openModal(name: string, modalSettings: any) {
        this.$emit('open-modal', name, modalSettings);
    }

    public abbreviate(stringValue: string, maxCharacters: number): string {
        if (stringValue.length <= maxCharacters) {
            return stringValue;
        }
        return stringValue.substring(0, maxCharacters-1) + '…';
    }

    public getTeamLogoUrl(team: any): string {
        return GameFinderHelpers.getTeamLogoUrl(team);
    }
}
</script>