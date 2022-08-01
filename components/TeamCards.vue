<template>
    <div id="cards" :class="{blackboxuseractivated: blackboxUserActivated}">
        <div class="card" v-for="myTeam in myTeams" :key="myTeam.id" @click="select(myTeam)"
            :class="{active: myTeam.id === selectedOwnTeamId, highlight: teamCanJoinBlackbox(myTeam), lowlight: !teamCanJoinBlackbox(myTeam)}"
            :title="myTeam.name + '\n' + myTeam.roster.name + '\n' + myTeam.division + (myTeam.league !== null && myTeam.league.name ? ' (' + myTeam.league.name + ')' : '')">
            <img class="logo" :src="getTeamLogoUrl(myTeam)">
            <div class="name"><span v-if="myTeam.isInTournament" title="This team is currently in a tournament.">🏆 </span>{{ myTeam.name }}</div>
            <div class="line"></div>
            <div class="opponentcount" :title="myTeam.allow.length + ' possible opponents.'">Opp:{{ myTeam.allow.length > 99 ? 99 : myTeam.allow.length }}</div>
            <div v-show="myTeam.hasUnreadItems" class="new" title="You have new opponents to view.">&#9679</div>
            <div class="tv">{{ myTeam.teamValue/1000 }}k</div>
            <div class="division">[{{ myTeam.division.charAt(0) }}]</div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';
import GameFinderHelpers from '../include/GameFinderHelpers';
import GameFinderPolicies from "../include/GameFinderPolicies";

@Component({
    props: {
        selectedOwnTeamId: {
            type: Number,
            required: true
        },
        myTeams: {
            type: Array,
            required: true
        },
        blackboxUserActivated: {
            type: Boolean,
            required: true
        },
    }
})
export default class TeamCardsComponent extends Vue {
    public select(team) {
        if (this.$props.blackboxUserActivated) {
            return;
        }
        this.$emit('select', team);
    }

    public getTeamLogoUrl(team: any): string {
        return GameFinderHelpers.getTeamLogoUrl(team);
    }

    public teamCanJoinBlackbox(team: any): boolean {
        return GameFinderPolicies.teamCanJoinBlackboxDraw(team);
    }
}
</script>