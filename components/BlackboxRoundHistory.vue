<template>
    <div class="blackboxroundhistory">
        <template v-for="round, key in rounds">
            <div :key="round.date">
                <div v-if="isNewDraw && key === 0" class="latestroundheader">
                    Results of latest draw
                </div>
                <div class="basicbox" :class="{mutedbasicbox: !(isNewDraw && key === 0)}">
                    <div class="header">Round of {{ round.date }}</div>
                    <div class="content">
                        <template v-if="round.matches.length > 0">
                            <div class="blackboxmatch" v-for="match in round.matches" :key="match.team1.coach + match.team2.coach">
                                <div class="homedetails">
                                    <div class="name">
                                        {{ match.team1.teamName }}
                                    </div>
                                    <div class="desc">
                                        ({{ match.team1.coachRating }}) <span :class="{isusercoach: match.team1.isUserCoach}">{{ match.team1.coach }}</span> {{ match.team1.teamValue/1000 }}k {{ match.team1.roster }}
                                    </div>
                                </div>
                                <div class="homeicon">
                                    <img :src="'https://fumbbl.com/i/' + match.team1.logo32">
                                </div>
                                <div v-if="match.team1.isUserCoach || match.team2.isUserCoach" class="versus ownmatch">
                                    &#x2605;
                                </div>
                                <div v-else class="versus">
                                    versus
                                </div>
                                <div class="awayicon">
                                    <img :src="'https://fumbbl.com/i/' + match.team2.logo32">
                                </div>
                                <div class="awaydetails">
                                    <div class="name">
                                        {{ match.team2.teamName }}
                                    </div>
                                    <div class="desc">
                                        {{ match.team2.roster }} {{ match.team2.teamValue/1000 }}k <span :class="{isusercoach: match.team2.isUserCoach}">{{ match.team2.coach }}</span> ({{ match.team2.coachRating }})
                                    </div>
                                </div>
                            </div>
                        </template>
                        <template v-else>
                            <div class="blackboxnomatches">
                                No matches were able to be made in this draw.
                            </div>
                        </template>
                    </div>
                </div>
                <div v-if="isNewDraw && key === 0" class="previousroundsheader">
                    Previous rounds
                </div>
            </div>
        </template>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';

@Component({
    props: {
        rawRoundHistory: {
            type: Object,
            required: true,
        },
        isNewDraw: {
            type: Boolean,
            required: true,
        },
        coachName: {
            type: String,
            required: true,
        }
    },
})
export default class BlackboxRoundHistoryComponent extends Vue {
    public get rounds(): any[] {
        const rounds = [];
        for (const round of this.$props.rawRoundHistory.rawRounds) {
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
                                isUserCoach: coach.coach === this.$props.coachName,
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
                                isUserCoach: coach.coach === this.$props.coachName,
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

            rounds.push({
                date: roundDateString,
                matches: matches,
            });
        }

        return rounds;
    }
}
</script>