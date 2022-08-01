<template>
    <div v-if="team" class="teamsettingsouter">
        <div class="teamsettingsinner">
            <a href="#" class="closemodal" @click.prevent="close">&times;</a>
            <div class="teamsettingstitle">
                <div class="icon">
                    <img :src="getTeamLogoUrl(team)" />
                </div>
                <div class="details">
                    <div class="name">{{ team.name }} [{{ team.division.charAt(0) }}]</div>
                    <div class="desc">{{ team.roster.name }}, {{ team.teamValue/1000 }}k</div>
                </div>
            </div>
            <div v-if="team.division === 'Competitive'" :class="{ settingssection: useSectionClasses }">
                <div class="title"><strong>Choose a team mode</strong></div>
                <div>
                    Teams in the Competitive division can be in 1 of 3 different modes. <strong>'Mixed'</strong> mode
                    is the most flexible as it allows the team to play via Gamefinder and Blackbox. <strong>'Strict'</strong>
                    mode restricts a team to only playing via Blackbox and <strong>'Open'</strong> restricts the team to only
                    play via Gamefinder.
                </div>
                <div class="currentmode">
                    <div>Current team mode: <strong>{{ team.lfgMode }}</strong></div>
                    <div><a href="#" @click.prevent="changeTeamModeChoices(true)" v-if="!showTeamModeChoices">Change mode</a></div>
                </div>
                <div v-show="showTeamModeChoices">
                    <div><label for="newmodechoice">Available team modes:</label></div>
                    <div id="newmodechoice" class="newmodechoice">
                        <select v-model="newModeChoice">
                            <option value="" selected>Please choose</option>
                            <option v-for="mode in ['Strict', 'Mixed', 'Open']" :key="mode" :value="mode">{{ mode }}</option>
                        </select>
                        <a href="#" @click.prevent="confirmChangeTeamMode()" class="confirm">Confirm</a>
                        <a href="#" @click.prevent="changeTeamModeChoices(false)">Cancel</a>
                    </div>
                    <div v-show="showModeChoiceError">Please choose a new mode (or click Cancel to stick with current mode).</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';
import GameFinderHelpers from "../include/GameFinderHelpers";
import IBackendApi from "../include/IBackendApi";
import { LfgMode } from "../include/Interfaces";

@Component({
    props: {
        isDevMode: {
            type: Boolean,
            required: true
        },
        team: {
            validator: function (teamId) {
                return typeof teamId === 'object' || teamId === null;
            }
        }
    },
    watch: {
        team: function () {
            // @ts-ignore: Property 'resetTeamSettings' does not exist on type 'Vue'.
            return this.resetTeamSettings();
        }
    }
})
export default class TeamSettingsComponent extends Vue {
    private backendApi: IBackendApi | null = null;
    public showTeamModeChoices: boolean = false;
    public newModeChoice: LfgMode | '' = '';
    public showModeChoiceError: boolean = false;
    public useSectionClasses: boolean = false; // when more than 1 section, remove this so sections can be distinguised by CSS class

    async mounted() {
        this.backendApi = GameFinderHelpers.getBackendApi(this.$props.isDevMode);
    }

    public close() {
        this.$emit('close-modal');
    }

    public resetTeamSettings() {
        this.showTeamModeChoices = false;
        this.newModeChoice = '';
        this.showModeChoiceError = false;
    }

    public getTeamLogoUrl(team: any, small: boolean = true): string {
        return GameFinderHelpers.getTeamLogoUrl(team, small);
    }

    public changeTeamModeChoices(show: boolean) {
        if (! show) {
            this.newModeChoice = '';
        }
        this.showTeamModeChoices = show;
        this.showModeChoiceError = false;
    }

    public async confirmChangeTeamMode() {
        if (this.newModeChoice === '') {
            this.showModeChoiceError = true;
            return;
        }
        await this.backendApi.changeLfgMode(this.$props.team.id, this.newModeChoice);
        this.$props.team.lfgMode = this.newModeChoice;

        this.changeTeamModeChoices(false);
    }
}
</script>