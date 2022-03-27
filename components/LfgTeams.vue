<template>
    <div class="basicbox">
        <div class="header">Select Teams</div>
        <div class="content" id="teamswrapper">
            <div class="lfgList">
                <div v-for="team in teams" :key="team.id" class="lfgteam">
                    <input class="teamcheck" type="checkbox" :value="team.id" v-model="checked" @change="toggleTeam">
                    <img :src="getTeamLogoUrl(team)" />
                    <div>
                        <div class="teamname">{{ abbreviate(team.name, 70) }}</div>
                        <div class="teaminfo"><span title="Seasons and games played">S{{ team.seasonInfo.currentSeason }}:G{{ team.seasonInfo.gamesPlayedInCurrentSeason }}</span> TV {{ team.teamValue/1000 }}k {{ team.roster.name }}</div>
                    </div>
                </div>
            </div>
            <div class="controls">
                <div id="selectall">
                    <input type="checkbox" id="all" @change="toggleAll"/>
                    <label for="all">Select All</label>
                </div>
                <input type="button" id="showlfg" value="Done" @click="showLfg" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';
import { Util } from '../../../core/util';
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

    async mounted() {
        this.backendApi = GameFinderHelpers.getBackendApi(this.$props.isDevMode);
        await this.reloadTeams();
    }

    public async showLfg() {
        await this.updateBlackboxData();
        this.$emit('show-lfg');
    }

    private async reloadTeams() {
        const teams = await this.backendApi.allTeams(this.$props.coachName);
        teams.sort(GameFinderPolicies.sortTeamByDivisionNameLeagueNameTeamName);
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

    public abbreviate(stringValue: string, maxCharacters: number): string {
        return Util.abbreviate(stringValue, maxCharacters);
    }

    public getTeamLogoUrl(team: any): string {
        return GameFinderHelpers.getTeamLogoUrl(team);
    }
}
</script>