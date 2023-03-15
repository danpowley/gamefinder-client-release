<template>
    <div id="lfgteams" class="basicbox" style="margin-top: 20px;">
        <div class="header">Select Teams</div>
        <div class="content" id="lfgteamswrapper">
            <div class="blackboxwarning" v-if="blackboxUserActivated">
                <strong>PLEASE NOTE: </strong> You are currently activated for Blackbox.
            </div>
            <div class="controls">
                <div class="selectall">
                    <input type="checkbox" id="selectallteamsbegin" class="selectallteams" @change="toggleAll"/>
                    <label for="selectallteamsbegin">Select All</label>
                </div>
                <div class="activate">
                    <template v-if="activateTeamsButtonClicked">
                        Please wait, teams activating.
                    </template>
                    <template v-else>
                        <input type="button" value="Activate teams" @click="showLfg" />
                    </template>
                </div>
                <div class="changemodes">
                    <a href="#" @click.prevent="toggleChangeModes">{{ changeModeEnabled ? 'End mode changes' : 'Change modes' }}</a>
                </div>
            </div>
            <div class="lfglist">
                <template v-for="division in teamsByDivision">
                    <div :key="division.name">
                        <div class="divisionheader">
                            <div class="headertext">{{ division.name }}</div>
                        </div>
                        <template v-for="team in division.teams">
                            <div :key="team.id" class="lfgteam">
                                <input class="teamcheck" type="checkbox" :value="team.id" v-model="checked" @change="toggleTeam">
                                <img :src="getTeamLogoUrl(team)" />
                                <div class="teamdetails">
                                    <div class="teamname">{{ team.name }}</div>
                                    <div class="teaminfo"><span title="Seasons and games played">S{{ team.seasonInfo.currentSeason }}:G{{ team.seasonInfo.gamesPlayedInCurrentSeason }}</span> TV {{ team.currentTeamValue/1000 }}k {{ team.roster.name }}</div>
                                    <div class="teammode" v-if="team.division === 'Competitive'">
                                        <div class="mode" title="Competitive division mode: Gamefinder, Blackbox or both">
                                            <template v-if="changeModeEnabled && team.modeLock !== true">
                                                <select @change="changeMode(team, $event)">
                                                    <option v-for="mode in ['Strict', 'Mixed', 'Open']" :key="mode" :value="mode" :selected="team.lfgMode === mode ? 'selected' : ''">{{ displayLfgMode(mode) }}</option>
                                                </select>
                                            </template>
                                            <template v-else>
                                                {{ displayLfgMode(team.lfgMode) }}
                                                <template v-if="team.modeLock === true">
                                                    <span class="modelocked"> 🔒</span>
                                                </template>
                                            </template>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                        <template v-for="league in division.leagues">
                            <div :key="league.name">
                                <div class="leagueheader">
                                    <div class="headertext">League teams for <strong>{{ league.name }}</strong></div>
                                </div>
                                <template v-for="team in league.teams">
                                    <div :key="team.id" class="lfgteam">
                                        <input class="teamcheck" type="checkbox" :value="team.id" v-model="checked" @change="toggleTeam">
                                        <img :src="getTeamLogoUrl(team)" />
                                        <div class="teamdetails">
                                            <div class="teamname">{{ team.name }}</div>
                                            <div class="teaminfo"><span title="Seasons and games played">S{{ team.seasonInfo.currentSeason }}:G{{ team.seasonInfo.gamesPlayedInCurrentSeason }}</span> TV {{ team.teamValue/1000 }}k {{ team.roster.name }}</div>
                                        </div>
                                    </div>
                                </template>
                            </div>
                        </template>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';
import GameFinderPolicies from '../include/GameFinderPolicies';
import GameFinderHelpers from '../include/GameFinderHelpers';
import IBackendApi from "../include/IBackendApi";
import { LfgModeApi, LfgModeUi } from "../include/Interfaces";

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
        blackboxUserActivated: {
            type: Boolean,
            required: true
        },
    }
})
export default class LfgTeamsComponent extends Vue {
    private backendApi: IBackendApi | null = null;
    public totalTeams: number = 0;
    public teamsByDivision: any[] = [];
    public checked: boolean[] = [];
    public activateTeamsButtonClicked: boolean = false;
    public changeModeEnabled: boolean = false;

    async mounted() {
        this.backendApi = GameFinderHelpers.getBackendApi(this.$props.isDevMode);
        this.activateTeamsButtonClicked = false;
        await this.reloadTeams();
    }

    public async showLfg() {
        this.activateTeamsButtonClicked = true;
        this.$emit('show-lfg');
    }

    private async reloadTeams() {
        const teams = await this.backendApi.allTeams(this.$props.coachName);
        this.totalTeams = teams.length;
        this.checked = teams.filter(GameFinderPolicies.teamIsLfg).map((team) => team.id);
        teams.sort(GameFinderPolicies.sortTeamByDivisionNameLeagueNameTeamName);
        this.teamsByDivision = this.groupTeamsByDivisionAndLeague(teams);
        this.updateAllChecked();
    }

    private groupTeamsByDivisionAndLeague(teams: any[]): any[] {
        const teamsByDivision = [];
        for (const team of teams) {
            let division = teamsByDivision.find((division) => {return division.name === team.division});
            if (! division) {
                division = {
                    name: team.division,
                    leagues: [],
                    teams: [],
                };
                teamsByDivision.push(division);
            }

            if (team.league && team.league.name) {
                let league = division.leagues.find((league) => {return league.name === team.league.name});
                if (! league) {
                    league = {
                        name: team.league.name,
                        teams: [],
                    };
                    division.leagues.push(league);
                }
                league.teams.push(team);
            } else {
                division.teams.push(team);
            }
        }
        return teamsByDivision;
    }

    public toggleAll(event) {
        const checked = event.target.checked;

        if (checked) {
            this.backendApi.addAllTeams();
        } else {
            this.backendApi.removeAllTeams();
        }

        const checkboxes = document.getElementsByClassName('teamcheck');

        const arr = [];
        for (let index=0; index<checkboxes.length; index++) {
            const c:any = checkboxes[index];
            c.checked = checked;
            if (checked) {
                arr.push(c.value);
            }
        }
        this.checked = arr;

        this.updateAllChecked();
    }

    public toggleTeam(event) {
        const target = event.target;
        const checked = target.checked;
        const id = target.value;

        if (checked) {
            this.backendApi.addTeam(id);
        } else {
            this.backendApi.removeTeam(id);
        }

        this.updateAllChecked();
    }

    private updateAllChecked()
    {
        const allCheckboxes:any = document.getElementsByClassName('selectallteams');

        let allChecked = this.totalTeams === this.checked.length;
        let allUnchecked = this.checked.length === 0;

        if (allUnchecked) {
            for (const allCheckbox of allCheckboxes) {
                allCheckbox.checked = false;
                allCheckbox.indeterminate = false;
            }
        } else if (allChecked) {
            for (const allCheckbox of allCheckboxes) {
                allCheckbox.checked = true;
                allCheckbox.indeterminate = false;
            }
        } else {
            for (const allCheckbox of allCheckboxes) {
                allCheckbox.checked = false;
                allCheckbox.indeterminate = true;
            }
        }
    }

    public getTeamLogoUrl(team: any): string {
        return GameFinderHelpers.getTeamLogoUrl(team);
    }

    public openModal(name: string, modalSettings: any) {
        this.$emit('open-modal', name, modalSettings);
    }

    public displayLfgMode(lfgMode: LfgModeApi): LfgModeUi {
        switch (lfgMode) {
            case 'Strict':
                return 'Blackbox only';
            case 'Mixed':
                return 'Gamefinder or Blackbox';
            case 'Open':
                return 'Gamefinder only';
            default:
                throw Error('Invalid lfg mode ' + lfgMode);
        }
    }

    public toggleChangeModes(): void {
        this.changeModeEnabled = ! this.changeModeEnabled;
    }

    public changeMode(team: any, event): void {
        const newLfgMode: LfgModeApi = event.target.value;

        // update the team property to instantly update the UI:
        team.lfgMode = newLfgMode;

        // save via API
        this.backendApi.changeLfgMode(team.id, newLfgMode);
    }
}
</script>