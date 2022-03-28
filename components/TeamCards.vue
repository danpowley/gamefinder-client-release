<template>
    <div id="teamcards">
        <div v-for="myTeam in myTeams" :key="myTeam.id" @click="select(myTeam)"
            class="teamcard" :class="{active: myTeam.selected}"
            :title="myTeam.name + '\n' + myTeam.roster.name + '\n' + myTeam.division + (myTeam.league !== null && myTeam.league.name ? ' (' + myTeam.league.name + ')' : '')">
            <div class="cardlogo"><img :src="getTeamLogoUrl(myTeam)"></div>
            <div class="cardinfo">
                <div class="teamname">
                    <div>{{ abbreviate(myTeam.name, 9) }}</div>
                </div>
                <div class="teaminfo">
                    <div class="divisionletter">[{{ myTeam.division.charAt(0) }}] <span class="newopponentsicon" v-show="myTeam.hasUnreadItems">&#9679</span></div>
                    <div class="teamvalue">{{ (myTeam.teamValue/1000) }}k</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';
import { Util } from "../../../core/util";
import GameFinderHelpers from '../include/GameFinderHelpers';

@Component({
    props: {
        myTeams: {
            type: Array,
            required: true
        }
    }
})
export default class TeamCardsComponent extends Vue {
    public select(team) {
        this.$emit('select', team);
    }

    public getTeamLogoUrl(team: any): string {
        return GameFinderHelpers.getTeamLogoUrl(team);
    }

    public abbreviate(stringValue: string, maxCharacters: number): string {
        return Util.abbreviate(stringValue, maxCharacters);
    }
}
</script>