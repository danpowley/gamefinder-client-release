<template>
    <div id="lfgteams" class="basicbox" style="margin-top: 20px;">
        <div class="header">Select Teams</div>
        <div class="content" id="lfgteamswrapper">
            <div class="lfgList">
                <template v-for="team in teams">
                    <div :key="team.id">
                        <div v-if="teamsShowDivisionLeagueHeader && teamsShowDivisionLeagueHeader['team' + team.id].showDivisionHeader" class="divisionheader">{{ team.division }}</div>
                        <div v-if="teamsShowDivisionLeagueHeader && teamsShowDivisionLeagueHeader['team' + team.id].showLeagueHeader" class="leagueheader">League teams for <strong>{{ team.league.name }}</strong></div>
                        <div class="lfgteam">
                            <input class="teamcheck" type="checkbox" :value="team.id" v-model="checked" @change="toggleTeam">
                            <img :src="getTeamLogoUrl(team)" />
                            <div class="teamdetails">
                                <div class="teamname">{{ team.name }}</div>
                                <div class="teaminfo"><span title="Seasons and games played">S{{ team.seasonInfo.currentSeason }}:G{{ team.seasonInfo.gamesPlayedInCurrentSeason }}</span> TV {{ team.teamValue/1000 }}k {{ team.roster.name }}</div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
            <div class="controls">
                <div id="selectall">
                    <input type="checkbox" id="all" @change="toggleAll"/>
                    <label for="all">Select All</label>
                </div>
                <template v-if="activateTeamsButtonClicked">
                    Please wait, teams activating.
                </template>
                <template v-else>
                    <input type="button" id="showlfg" value="Activate teams" @click="showLfg" />
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

@Component({
    props: {  
        isDevMode: {
            type: Boolean,
            required: true
        },
        coachName: {
            type: String,
            required: true
        }
    }
})
export default class LfgTeamsComponent extends Vue {
    private backendApi: IBackendApi | null = null;
    public teams: any[] = [];
    public checked: boolean[] = [];
    public activateTeamsButtonClicked: boolean = false;
    public teamsShowDivisionLeagueHeader: any | null = null;

    async mounted() {
        this.backendApi = GameFinderHelpers.getBackendApi(this.$props.isDevMode);
        this.activateTeamsButtonClicked = false;
        await this.reloadTeams();
    }

    public async showLfg() {
        this.activateTeamsButtonClicked = true;
        await this.updateBlackboxData();
        this.$emit('show-lfg');
    }

    private async reloadTeams() {
        const teams = await this.backendApi.allTeams(this.$props.coachName);
        teams.sort(GameFinderPolicies.sortTeamByDivisionNameLeagueNameTeamName);
        this.teamsShowDivisionLeagueHeader = GameFinderHelpers.getTeamsShowDivisionLeagueHeader(teams);
        this.teams = teams;

        this.checked = teams.filter(GameFinderPolicies.teamIsLfg).map((team) => team.id);

        this.updateAllChecked();
    }

    private async updateBlackboxData() {
        const teams = await this.backendApi.allTeams(this.$props.coachName);
        const availableTeams = teams.filter(GameFinderPolicies.teamIsCompetitiveDivision);
        const chosenTeams = availableTeams.filter(GameFinderPolicies.teamIsLfg);

        this.$emit('blackbox-data', {
            available: availableTeams.length,
            chosen: chosenTeams.length
        });
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
        const allCheckbox:any = document.getElementById('all');

        let allChecked = this.teams.length === this.checked.length;
        let allUnchecked = this.checked.length === 0;

        if (allUnchecked) {
            allCheckbox.checked = false;
            allCheckbox.indeterminate = false;
        } else if (allChecked) {
            allCheckbox.checked = true;
            allCheckbox.indeterminate = false;
        } else {
            allCheckbox.checked = false;
            allCheckbox.indeterminate = true;
        }
    }

    public getTeamLogoUrl(team: any): string {
        return GameFinderHelpers.getTeamLogoUrl(team);
    }
}
</script>