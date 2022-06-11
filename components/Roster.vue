<template>
    <div v-if="rosterData" class="rosterouter">
        <div class="rosterinner">
            <a href="#" class="closemodal" @click.prevent="close">&times;</a>
            <div class="displayteam">
                <div class="displayteamheader">
                    <div class="logo">
                        <img :src="getTeamLogoUrl(settings.displayTeam, false)" />
                    </div>
                    <div class="details">
                        <div class="name">
                            <a class="teampagelink" :href="'https://fumbbl.com/p/team?team_id=' + rosterData.id" target="_blank" :title="'Open team page for ' + rosterData.name + ' in a new tab.'">{{ rosterData.name }}</a> (<a class="coachpagelink" :href="'https://fumbbl.com/~' + rosterData.coach.name" target="_blank" :title="'Open coach page for ' + rosterData.coach.name + ' in a new tab'">{{ rosterData.coach.name }}</a>)
                        </div>
                        <div class="info">
                            <div>
                                <span title="Team Value">{{ rosterData.teamValue/1000 }}k</span> {{ rosterData.roster.name }}
                            </div>
                            <div class="subinfo">
                                <span class="rosterfact" title="Seasons and games played.">S{{ settings.displayTeam.seasonInfo.currentSeason }}:G{{ settings.displayTeam.seasonInfo.gamesPlayedInCurrentSeason }}</span>
                                <span class="rosterfact" title="Team record: win/tie/loss">Record:{{ rosterData.record.wins }}/{{ rosterData.record.ties }}/{{ rosterData.record.losses }}</span>
                                <span class="rosterfact" title="Players available (not MNG)">Players:{{ availablePlayers(rosterData.groupedPlayers) }}</span>
                                <span class="rosterfact" title="Number of rerolls">RR:{{ rosterData.rerolls }}</span>
                                <span class="rosterfact" title="Apothecary">Apo:{{ rosterData.apothecary === 'Yes' ? 'Yes' : 'No' }}</span>
                                <span class="rosterfact" title="Dedicated fans.">DF:{{rosterData.fanFactor}}</span>
                                <span class="rosterfact" title="Treasury available">Tr:{{ rosterData.treasury/1000 }}k</span>
                            </div>
                        </div>
                    </div>
                </div>
                <template v-for="playerGroup in rosterData.groupedPlayers">
                    <div :key="playerGroup.title" v-if="playerGroup.players.length > 0">
                        <h3 v-if="playerGroup.title === 'mngPlayers'">Missing next game (MNG)</h3>
                        <table cellspacing="0" cellpadding="0" width="100%">
                            <tr v-for="player in playerGroup.players" :key="player.id">
                                <td style="width: 45px;">
                                    <div :style="getPlayerIconStyle(player.positionId, rosterData.positionIcons)"></div>
                                </td>
                                <td class="position">{{ player.position }}</td>
                                <td class="injuries">{{ player.injuries }}</td>
                                <td>{{ player.skills }}</td>
                            </tr>
                        </table>
                    </div>
                </template>
            </div>
            <template v-if="! isMyTeam">
                <div class="rosteroffers">
                    <div class="title">Send offers <span class="zenmodeonly">against {{ rosterData.roster.name }}, see % TV diffs below:</span></div>
                    <template v-if="ownTeamsOfferable.length > 0">
                        <div style="margin-bottom: 10px;">Click any of the following teams to send an offer.</div>
                    </template>
                    <template v-else>
                        <div class="noteamsallowedtooffer">
                            <p>None of your teams are allowed to make offers to this team.</p>

                            <p>The most common reasons teams are not showing up here are:</p>
                            <ul>
                                <li>Teams have to be in the same division (eg, Competitive division teams cannot offer to League division teams)</li>
                                <li>Teams have to be using the same ruleset</li>
                                <li>Teams have to be in the same league, or both leagues need to allow cross-league games</li>
                                <li>You or your opponent may have recently declined or cancelled a specific match between teams</li>
                            </ul>
                            <p>Competitive division teams have further restrictions:</p>
                            <ul>
                                <li>Teams have to be within certain TV limits (especially for rookie teams)</li>
                                <li>You cannot play a coach too often</li>
                            </ul>
                            <p>If you think your team should be able to make an offer, please ask for Help via Discord or submit a support ticket.</p>
                        </div>
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
                positionIcons[position.id] = {iconId: position.icon, iconSize: await this.getIconSize(position.icon)};
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

            rosterData.groupedPlayers = [
                {
                    title: 'matchPlayers',
                    players: rosterData.players.filter((player) => {return ! player.injuries.split(',').includes('m')}),
                },
                {
                    title: 'mngPlayers',
                    players: rosterData.players.filter((player) => {return player.injuries.split(',').includes('m')}),
                }
            ],

            data = {
                expiry: Date.now() + 60000,
                roster: rosterData,
            }
            this.rosterCache[teamId] = data;
        }

        return data.roster;
    }

    public availablePlayers(groupedPlayers): number {
        const matchPlayersGroup = groupedPlayers.find((playerGroup) => {
            return playerGroup.title === 'matchPlayers';
        });

        return matchPlayersGroup.players.length;
    }

    public async getIconSize(positionIconId: number): Promise<number> {
        const imageDimensions = (imageUrl): Promise<{width: number, height: number}> =>
            new Promise((resolve, reject) => {
                const img = new Image()

                img.onload = () => {
                    const { naturalWidth: width, naturalHeight: height } = img;
                    resolve({ width, height });
                }

                img.onerror = () => {
                    reject('There was some problem with the image.');
                }

                img.src = imageUrl;
            }
        );

        try {
            const dimensions = await imageDimensions(`https://fumbbl.com/i/${positionIconId}`);
            return dimensions.width / 4;
        } catch(error) {
            return 30;
        }
    }

    public sendOffer(myTeam): void {
        if (this.recentOffersSent.includes(myTeam.id)) {
            return;
        }
        this.backendApi.sendOffer(myTeam.id, this.$props.settings.displayTeam.id);
        this.recentOffersSent.push(myTeam.id);
    }

    public getTeamLogoUrl(team: any, small: boolean = true): string {
        return GameFinderHelpers.getTeamLogoUrl(team, small);
    }

    public getPlayerIconStyle(positionId: number, positionIcons: any): string {
        const positionIconInfo: {iconId: number, iconSize: number} = positionIcons[positionId];
        return `width: ${positionIconInfo.iconSize}px; height: ${positionIconInfo.iconSize}px; background: rgba(0, 0, 0, 0) url("https://fumbbl.com/i/${positionIconInfo.iconId}") repeat scroll 0px 0px;'"`;
    }

    public getTvPercentDiff(teamValue1: number, teamValue2: number): number {
        return GameFinderHelpers.getTvPercentDiff(teamValue1, teamValue2);
    }
}
</script>