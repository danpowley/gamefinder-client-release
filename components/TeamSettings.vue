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
            <p>There aren't any team settings to configure for now...</p>
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
        team: {
            validator: function (teamId) {
                return typeof teamId === 'object' || teamId === null;
            }
        }
    },
})
export default class TeamSettingsComponent extends Vue {
    private backendApi: IBackendApi | null = null;
    public showTeamModeChoices: boolean = false;
    public showModeChoiceError: boolean = false;
    public useSectionClasses: boolean = false; // when more than 1 section, remove this so sections can be distinguised by CSS class

    async mounted() {
        this.backendApi = GameFinderHelpers.getBackendApi(this.$props.isDevMode);
    }

    public close() {
        this.$emit('close-modal');
    }

    public getTeamLogoUrl(team: any, small: boolean = true): string {
        return GameFinderHelpers.getTeamLogoUrl(team, small);
    }
}
</script>