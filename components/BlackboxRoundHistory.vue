<template>
    <div class="blackboxroundhistoryouter">
        <div class="blackboxroundhistoryinner">
            <a href="#" class="closemodal" @click.prevent="close">&times;</a>
            <div class="settingstitle">Blackbox round history</div>
            <div v-for="round in rounds" :key="round.date" class="basicbox">
                <div class="header">Round of {{ round.date }}</div>
                <div class="content">
                    <div class="blackboxmatch" v-for="match in round.matches" :key="match.team1.coach + match.team2.coach">
                        <div class="homedetails">
                            <div class="name">
                                {{ match.team1.teamName }}
                            </div>
                            <div class="desc">
                                ({{ match.team1.coachRating }}) {{ match.team1.coach }} {{ match.team1.teamValue/1000 }}k {{ match.team1.roster }}
                            </div>
                        </div>
                        <div class="homeicon">
                            <img :src="'https://fumbbl.com/i/' + match.team1.logo32">
                        </div>
                        <div class="versus">versus</div>
                        <div class="awayicon">
                            <img :src="'https://fumbbl.com/i/' + match.team2.logo32">
                        </div>
                        <div class="awaydetails">
                            <div class="name">
                                {{ match.team2.teamName }}
                            </div>
                            <div class="desc">
                                {{ match.team2.roster }} {{ match.team2.teamValue/1000 }}k {{ match.team2.coach }} ({{ match.team2.coachRating }})
                            </div>
                        </div>
                    </div>
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

@Component({
    props: {
        isDevMode: {
            type: Boolean,
            required: true
        },
        blackbox: {
            validator: function (blackbox) {
                return typeof blackbox === 'object' || blackbox === null;
            }
        }
    },
})
export default class BlackboxRoundHistoryComponent extends Vue {
    private backendApi: IBackendApi | null = null;
    public rounds: any[] = [];

    public close() {
        this.$emit('close-modal');
    }

    public mounted() {
        this.backendApi = GameFinderHelpers.getBackendApi(this.$props.isDevMode);
        this.prepareRoundHistory();
    }

    public async prepareRoundHistory() {
        const rawRoundHistory: any[] = await this.backendApi.blackboxRoundHistory();

        const rounds = [];
        for (const round of rawRoundHistory) {
            const roundDateString = round.round.slice(0, -3);
            const teamData = round.teamData;
            const scheduledMatches = round.data.ScheduledMatches;

            const matches = [];

            for (const scheduledMatch of scheduledMatches) {
                const match: any = {};
                const team1Id = scheduledMatch.Team1.TeamId;
                const team2Id = scheduledMatch.Team2.TeamId;
                for (const coach of teamData) {
                    for (const teamId of Object.keys(coach.teams)) {
                        if (teamId == team1Id) {
                            match.team1 = {
                                coach: coach.coach,
                                coachRating: coach.rating,
                                teamName: coach.teams[teamId].team,
                                roster: coach.teams[teamId].roster,
                                teamValue: coach.teams[teamId].teamValue,
                                logo32: coach.teams[teamId].logo32,
                                logo64: coach.teams[teamId].logo64,
                            };
                        }
                        if (teamId == team2Id) {
                            match.team2 = {
                                coach: coach.coach,
                                coachRating: coach.rating,
                                teamName: coach.teams[teamId].team,
                                roster: coach.teams[teamId].roster,
                                teamValue: coach.teams[teamId].teamValue,
                                logo32: coach.teams[teamId].logo32,
                                logo64: coach.teams[teamId].logo64,
                            };
                        }
                    }
                }
                if (match.team1 && match.team2) {
                    matches.push(match);
                }
            }

            if (matches.length > 0) {
                rounds.push({
                    date: roundDateString,
                    matches: matches,
                });
            }
        }

        this.rounds = rounds;
    }
}
</script>