<template>
    <div v-if="rosterData" class="rosterouter">
        <div class="rosterinner">
            <a href="#" class="closemodal" @click.prevent="close">&times;</a>
            <div class="displayteam">
                <div class="displayteamheader">
                    <div class="logo">
                        <img :src="getTeamLogoUrl(settings.displayTeam)" />
                    </div>
                    <div class="details">
                        <div class="name">
                            <!-- @christer absolute url used multiple times -->
                            <a class="teampagelink" :href="'https://fumbbl.com/p/team?team_id=' + rosterData.id" target="_blank" :title="'Open team page for ' + rosterData.name + ' in a new tab.'">{{ rosterData.name }}</a> (<a class="coachpagelink" :href="'https://fumbbl.com/~' + rosterData.coach.name" target="_blank" :title="'Open coach page for ' + rosterData.coach.name + ' in a new tab'">{{ rosterData.coach.name }}</a>)
                        </div>
                        <div class="info">
                            <span title="Team Value">{{ rosterData.teamValue/1000 }}k</span> {{ rosterData.roster.name }}, <span title="Number of rerolls">{{ rosterData.rerolls }} RR</span>, <span title="Dedicated fans.">{{rosterData.fanFactor}} DF</span>, <span title="Treasury available">{{ rosterData.treasury/1000 }}k gold</span>, <span title="Seasons and games played.">S{{ settings.displayTeam.seasonInfo.currentSeason }}:G{{ settings.displayTeam.seasonInfo.gamesPlayedInCurrentSeason }}</span>, <span title="Team record: win/tie/loss">{{ rosterData.record.wins }}/{{ rosterData.record.ties }}/{{ rosterData.record.losses }}</span>
                        </div>
                    </div>
                </div>
                <table cellspacing="0" cellpadding="0" width="100%">
                    <tr v-for="player in rosterData.players" :key="player.id">
                        <!-- @christer absolute url used -->
                        <td :style="getPlayerIconStyle(player.positionId, rosterData.positionIcons)"></td>
                        <td class="position">{{ player.position }}</td>
                        <td class="injuries">{{ player.injuries }}</td>
                        <td>{{ player.skills }}</td>
                    </tr>
                </table>
            </div>
            <template v-if="! isMyTeam">
                <div class="rosteroffers">
                    <div class="title">Send offers <span class="zenmodeonly">against {{ rosterData.roster.name }}, see % TV diffs below:</span></div>
                    <template v-if="ownTeamsOfferable.length > 0">
                        <div style="margin-bottom: 10px;">Click any of the following teams to send an offer.</div>
                    </template>
                    <template v-else>
                        <div style="margin-bottom: 10px;">None of your teams are allowed to make offers to this team.</div>
                    </template>
                    <div v-for="myTeam in ownTeamsOfferable" :key="myTeam.id" class="rosterofferteam" :class="{recentoffersent: recentOffersSent.includes(myTeam.id)}" @click="sendOffer(myTeam)">
                        <div class="logo">
                            <img :src="getTeamLogoUrl(myTeam)" />
                        </div>
                        <div class="details">
                            <div class="name">
                                {{ myTeam.name }}
                            </div>
                            <div class="info">
                                <template v-if="! recentOffersSent.includes(myTeam.id)">
                                    {{ myTeam.teamValue/1000 }}k {{ myTeam.roster.name }} <span class="zenmodeonly">({{ getTvPercentDiff(rosterData.teamValue, myTeam.teamValue) }}% TV diff)</span>
                                </template>
                                <template v-else>
                                    <span class="offeredtag">Offered</span>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';
import GameFinderHelpers from "../include/GameFinderHelpers";
import IBackendApi from "../include/IBackendApi";

@Component({
    props: {
        isDevMode: {
            type: Boolean,
            required: true
        },
        settings: {
            validator: function (settings) {
                return typeof settings === 'object' || settings === null;
            }
        }
    },
    watch: {
        settings: function () {
            // @ts-ignore: Property 'loadRosterData' does not exist on type 'Vue'.
            return this.loadRosterData();
        }
    }
})
export default class RosterComponent extends Vue {
    private backendApi: IBackendApi | null = null;
    public rosterData = null;
    public ownTeamsOfferable: any[] = [];
    public isMyTeam: boolean = false;
    private rosterCache:any = {};
    public recentOffersSent: number[] = [];

    mounted() {
        this.backendApi = GameFinderHelpers.getBackendApi(this.$props.isDevMode);
    }

    public async loadRosterData() {
        if (this.$props.settings === null) {
            this.rosterData = null;
            this.ownTeamsOfferable = [];
            this.isMyTeam = false;
            this.recentOffersSent = [];
            return;
        }

        const rosterData = await this.getRoster(this.$props.settings.displayTeam.id);
        this.rosterData = rosterData;
        this.ownTeamsOfferable = this.$props.settings.ownTeamsOfferable;
        this.isMyTeam = this.$props.settings.isMyTeam;
    }

    public close() {
        this.$emit('close-modal');
    }

    private async getRoster(teamId) {
        let data = this.rosterCache[teamId];

        if (this.rosterCache[teamId] != undefined) {
            if (data.expiry < Date.now()) {
                data = undefined;
            }
        }
        if (data == undefined) {
            const rosterData = await this.backendApi.rosterData(teamId);

            const rosterSettings = await this.backendApi.rosterSettings(rosterData.roster.id);
            const positionIcons = {};
            for (const position of rosterSettings.positions) {
                positionIcons[position.id] = position.icon;
            }
            rosterData.positionIcons = positionIcons;

            for (const p of rosterData.players) {
                p.skills.sort((a,b) => a.localeCompare(b));
                p.skills = p.skills.join(', ');
            }

            rosterData.players.sort((a,b) => {
                let r = a.position.localeCompare(b.position);
                if (r == 0) {
                    r = b.skills.length - a.skills.length;
                }
                return r;
            });

            data = {
                expiry: Date.now() + 60000,
                roster: rosterData,
            }
            this.rosterCache[teamId] = data;
        }

        return data.roster;
    }

    public sendOffer(myTeam): void {
        if (this.recentOffersSent.includes(myTeam.id)) {
            return;
        }
        this.backendApi.sendOffer(myTeam.id, this.$props.settings.displayTeam.id);
        this.recentOffersSent.push(myTeam.id);
    }

    public getTeamLogoUrl(team: any): string {
        return GameFinderHelpers.getTeamLogoUrl(team);
    }

    public getPlayerIconStyle(positionId: number, positionIcons: any): string {
        const positionIconId = positionIcons[positionId];
        return `width: 28px; height: 28px; background: rgba(0, 0, 0, 0) url("https://fumbbl.com/i/${positionIconId}") repeat scroll 0px 0px;'"`;
    }

    public getTvPercentDiff(teamValue1: number, teamValue2: number): number {
        return GameFinderHelpers.getTvPercentDiff(teamValue1, teamValue2);
    }
}
</script>