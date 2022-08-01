<template>
    <div id="selectedownteam">
        <template v-if="blackboxUserActivated">
            <div>
                <div>
                    You are activated to join the next Blackbox round. You can still send and receive Gamefinder offers up until 30 seconds before the draw.
                </div>
            </div>
        </template>
        <template v-else-if="team">
            <div class="logo">
                <img :src="getTeamLogoUrl(team)" />
            </div>
            <div class="teamdetails">
                <div class="teamname"><a href="#" @click.prevent="openModal('ROSTER', {team: team})">{{ team.name }}</a></div>
                <div class="teaminfo"><span title="Seasons and games played">S{{ team.seasonInfo.currentSeason }}:G{{ team.seasonInfo.gamesPlayedInCurrentSeason }}</span> TV {{ team.teamValue/1000 }}k {{ team.roster.name }}</div>
            </div>
            <div class="teamextras">
                <div class="divisionleagueinfo">{{ team.division }}</div>
                <div class="teamlinks">
                    <a v-show="teamSettingsEnabled" href="#" @click.prevent="openModal('TEAM_SETTINGS', {team: team})">Settings</a>
                    <a href="#" @click.prevent="deselectTeam">Deselect</a>
                </div>
            </div>
        </template>
        <template v-else>
            <div>
                <strong>No team selected.</strong> Click a team above to filter opponents to match that team. When no team is selected, you can choose to either view everyone on Gamefinder or just those who have at least 1 offerable match for your activated teams (see settings for more).
            </div>
        </template>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';
import GameFinderHelpers from '../include/GameFinderHelpers';

@Component({
    props: {
        team: {
            validator: function (team) {
                return typeof team === 'object' || team === null;
            }
        },
        teamSettingsEnabled: {
            type: Boolean,
            required: true
        },
        blackboxUserActivated: {
            type: Boolean,
            required: true
        }
    }
})
export default class SelectedOwnTeamComponent extends Vue {
    public deselectTeam() {
        this.$emit('deselect-team');
    }

    public openModal(name: string, modalSettings: any) {
        this.$emit('open-modal', name, modalSettings);
    }

    public getTeamLogoUrl(team: any): string {
        return GameFinderHelpers.getTeamLogoUrl(team);
    }
}
</script>