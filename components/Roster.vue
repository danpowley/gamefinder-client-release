<template>
    <div v-if="rosterData" class="rosterouter">
        <div class="rosterinner">
            <a href="#" class="closemodal" @click.prevent="close">&times;</a>
            <div class="displayteam">
                <div class="displayteamheader">
                    <div class="logo">
                        <img :src="getTeamLogoUrl(rosterData)" />
                    </div>
                    <div class="details">
                        <div class="name">
                            <!-- @christer absolute url used multiple times -->
                            <a :href="'https://fumbbl.com/p/team?team_id=' + rosterData.id" target="_blank" :title="rosterData.name">{{ abbreviate(rosterData.name, 30) }}</a> (<a :href="'https://fumbbl.com/~' + rosterData.coach" target="_blank" :title="rosterData.coach">{{ abbreviate(rosterData.coach, 10) }}</a>)
                        </div>
                        <div class="info">
                            <!-- @christer new properties used that won't exist yet in main API (currentSeason, gamesPlayedInSeason) -->
                            <span title="Team Value">{{ rosterData.teamValue/1000 }}k</span> {{ rosterData.race }}, <span title="Number of rerolls">{{ rosterData.rerolls }} RR</span>, <span title="Dedicated fans.">{{rosterData.fanFactor}} DF</span>, <span title="Treasury available">{{ rosterData.treasury/1000 }}k gold</span>, <span title="Seasons and games played.">S{{ rosterData.currentSeason }}:G{{ rosterData.gamesPlayedInSeason }}</span>, <span title="Team record: win/tie/loss">{{ rosterData.record.wins }}/{{ rosterData.record.ties }}/{{ rosterData.record.losses }}</span>
                        </div>
                    </div>
                </div>
                <table cellspacing="0" cellpadding="0" width="100%">
                    <tr v-for="player in rosterData.players" :key="player.id">
                        <!-- @christer absolute url used -->
                        <td style="width: 34px; height: 34px; background: rgba(0, 0, 0, 0) url('http://fumbbl.com/i/585610') repeat scroll 0px -68px;"></td>
                        <td class="position">{{ player.position }}</td>
                        <td class="injuries">{{ player.injuries }}</td>
                        <td>{{ player.skills }}</td>
                    </tr>
                </table>
            </div>
            <template v-if="! isMyTeam">
                <div class="rosteroffers">
                    <div class="title">Send offers:</div>
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
                                {{ abbreviate(myTeam.name, 30) }}
                            </div>
                            <div class="info">
                                <template v-if="! recentOffersSent.includes(myTeam.id)">
                                    {{ myTeam.teamValue/1000 }}k {{ myTeam.race }}
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
import { Util } from '../../../core/util';
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

    public abbreviate(stringValue: string, maxCharacters: number): string {
        return Util.abbreviate(stringValue, maxCharacters);
    }

    public getTeamLogoUrl(team: any): string {
        return GameFinderHelpers.getTeamLogoUrl(team);
    }
}
</script>