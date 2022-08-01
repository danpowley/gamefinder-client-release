<template>
    <div v-if="isOpen" class="blackboxpreviousdrawouter">
        <div class="blackboxpreviousdrawinner">
            <a href="#" class="closemodal" @click.prevent="close">&times;</a>
            <div style="font-size: 14pt;">Under construction</div>
            <div>In the near future this will display details of recent Blackbox rounds.</div>
            <div v-for="match in fakeMatches" :key="match.home.coach.name + match.away.coach.name">
                <div class="details">
                    <div class="homedetails">
                        <div class="name">
                            {{ match.home.name }}
                        </div>
                        <div class="coach">
                            {{ match.home.coach.name }}
                        </div>
                        <div class="desc">
                            TV {{ match.home.tv }} {{ match.home.roster.name }}
                        </div>
                    </div>
                    <strong>versus</strong>
                    <div class="awaydetails">
                        <div class="name">
                            {{ match.away.name }}
                        </div>
                        <div class="coach">
                            {{ match.away.coach.name }}
                        </div>
                        <div class="desc">
                            {{ match.away.roster.name }} TV {{ match.away.tv }}
                        </div>
                    </div>
                </div>
                <hr>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';
import { BlackboxMatch } from "../include/Interfaces";

@Component({
    props: {
        isOpen: {
            type: Boolean,
            required: true,
        },
        blackbox: {
            validator: function (blackbox) {
                return typeof blackbox === 'object' || blackbox === null;
            }
        }
    },
})
export default class BlackboxPreviousDrawComponent extends Vue {
    public fakeMatches: BlackboxMatch[] = [];

    public close() {
        this.$emit('close-modal');
    }

    public mounted() {
        this.fakeMatches =  [
            {
              home: {
                  name: 'Team Raspberry £',
                  coach: {
                      name: 'Coach A'
                  },
                  tv: 1000000,
                  roster: {
                      name: 'Skaven'
                  },
              },
              away: {
                  name: 'Team Grape $',
                  coach: {
                      name: 'Coach B',
                  },
                  tv: 1000000,
                  roster: {
                      name: 'Snotling',
                  },
              },
            },
            {
              home: {
                  name: 'Team Orange *',
                  coach: {
                      name: 'Coach C'
                  },
                  tv: 1000000,
                  roster: {
                      name: 'Slann'
                  },
              },
              away: {
                  name: 'Team Kiwi +',
                  coach: {
                      name: 'Coach D',
                  },
                  tv: 1000000,
                  roster: {
                      name: 'Halfling',
                  },
              },
            }
        ];
        this.fakeMatches = [];
    }
}
</script>