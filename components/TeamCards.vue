<template>
    <div id="cards">
        <div class="card" v-for="myTeam in myTeams" :key="myTeam.id" @click="select(myTeam)"
            :class="{active: myTeam.selected}"
            :title="myTeam.name + '\n' + myTeam.roster.name + '\n' + myTeam.division + (myTeam.league !== null && myTeam.league.name ? ' (' + myTeam.league.name + ')' : '')">
            <img class="logo" :src="getTeamLogoUrl(myTeam)">
            <div class="name">{{ myTeam.name }}</div>
            <div class="line"></div>
            <div class="opponentcount" :title="myTeam.allow.length + ' possible opponents.'">Opp:{{ myTeam.allow.length > 99 ? 99 : myTeam.allow.length }}</div>
            <div class="new" title="You have new opponents to view." v-show="myTeam.hasUnreadItems">&#9679</div>
            <div class="tv">{{ myTeam.teamValue/1000 }}k</div>
            <div class="division">[{{ myTeam.division.charAt(0) }}]</div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';
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
}
</script>