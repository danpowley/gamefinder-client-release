<template>
    <div class="basicbox">
        <div class="header">Match Offers<div v-show="additionalOffers > 0" class="additionaloffers">Additional offers: {{ additionalOffers }}</div></div>
        <div class="content" id="offerlistwrapper" @mouseenter="setUiUpdatesPaused(true)" @mouseleave="setUiUpdatesPaused(false)">
            <div v-show="offers.length === 0" class="nooffers">Sorry, no current offers.</div>
            <div id="offerlist">
                <div v-for="offer in offers" :key="offer.id" class="matchoffer" :class="{fadeout: fadeOutId === offer.id}">
                    <div class="icon external" v-show="offer.external">?</div>
                    <div class="icon accept" v-show="offer.external" @click.prevent="acceptOffer(offer)">&#x2714;</div>
                    <div class="icon cancel" @click.prevent="cancelOffer(offer)">&#x2718;</div>
                    <div class="offeredteam home">
                        <div class="name">
                            {{ abbreviate(offer.home.team, 30) }}
                        </div>
                        <div class="coach">
                            {{ offer.home.coach.name }} ({{ offer.home.coach.rating }})
                        </div>
                        <div class="desc">
                            TV {{ offer.home.tv }} {{ offer.home.roster.name }}
                        </div>
                    </div>
                    <div class="timer" :style="{ width: (100 * offer.timeRemaining / offer.lifetime) + '%', left: (50 - 50 * offer.timeRemaining / offer.lifetime) + '%'}"></div>
                    <div class="offeredteam away">
                        <div class="desc">
                            {{ offer.away.roster.name }} TV {{ offer.away.tv }}
                        </div>
                        <div class="coach">
                            {{ offer.away.coach.name }} ({{ offer.away.coach.rating }})
                        </div>
                        <div class="name">
                            {{ abbreviate(offer.away.team, 30) }}
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
import { Util } from '../../../core/util';
import IBackendApi from "../include/IBackendApi";
import GameFinderHelpers from "../include/GameFinderHelpers";

@Component({
    props: {
        isDevMode: {
            type: Boolean,
            required: true
        },
        coachName: {
            type: String,
            required: true
        },
        offers: {
            type: Array,
            required: true
        },
        myTeams: {
            type: Array,
            required: true
        },
        hiddenCoaches: {
            type: Array,
            required: true
        }
    }
})
export default class OffersComponent extends Vue {
    private backendApi: IBackendApi | null = null;
    public additionalOffers: number = 0;
    public pendingOffers:any = [];

    private uiUpdatesPaused: boolean = false;

    public fadeOutId: number | null = null;

    async mounted() {
        this.backendApi = GameFinderHelpers.getBackendApi(this.$props.isDevMode);
        setInterval(this.tick, 100);
        setInterval(this.getOffers, 1000);
    }

    public tick() {
        this.updateTimeRemaining();
        this.processOffers();
    }

    private updateTimeRemaining() {
        const now = Date.now();
        for (const o of this.$props.offers) {
            o.timeRemaining = o.expiry - now;
        }
    }

    private async getOffers() {
        const pre = Date.now();
        const offers = await this.backendApi.getOffers();
        const now = Date.now();

        const avgTime = now / 2 + pre / 2;

        let startDialogOffer = null;
        let launchGameOffer = null;

        for (const offer of offers) {
            offer.expiry = avgTime + offer.timeRemaining;
            offer.external = offer.awaitingResponse === true && offer.showDialog === false;

            // Swap teams if the first team is the opponent's
            if (offer.team2.coach.name === this.$props.coachName) {
                const x = offer.team1;
                offer.team1 = offer.team2;
                offer.team2 = x;
            }

            const offerCreated = this.createOfferAndAddToPending(offer);

            if (offer.launchGame === true) {
                launchGameOffer = offerCreated;
            } else if (offer.showDialog === true) {
                startDialogOffer = offerCreated;
            }
        }

        this.$emit('show-dialog', startDialogOffer);
        this.$emit('launch-game', launchGameOffer);
    }

    private processOffers() {
        const now = Date.now();

        // Process match offers
        for (let i = this.$props.offers.length - 1; i>=0; i--) {
            if (! this.isOfferValid(now, this.$props.offers[i])) {
                this.$props.offers.splice(i, 1);
            }
        }

        if (! this.uiUpdatesPaused) {
            while(this.pendingOffers.length > 0) {
                const newOffer = this.pendingOffers.pop();

                let processed = false;
                for (const o of this.$props.offers) {
                    if (newOffer.id == o.id) {
                        processed = true;
                        // Update expiry time just to be sure.
                        o.timeRemaining = newOffer.expiry - now;
                        o.expiry = newOffer.expiry;
                    }
                }

                if (!processed) {
                    this.$props.offers.unshift(newOffer);
                }
            }
            this.additionalOffers = 0;
        } else {
            let num = 0;
            for (const pending of this.pendingOffers) {
                let found = false;
                for (const o of this.$props.offers) {
                    if (pending.id == o.id) {
                        found = true;
                    }
                }
                if (!found) {
                    if (this.isOfferValid(now, pending)) {
                        num++;
                    }
                }
            }
            this.additionalOffers = num;
        }
    }

    private isOfferValid(now: number, offer: any): boolean {
        if (offer.expiry < now) {
            return false;
        }

        const myTeam = this.getMyTeam(offer.home.id);

        if (! myTeam) {
            return false;
        }

        const isMatchAllowed = myTeam.allow.includes(offer.away.id);

        if (! isMatchAllowed) {
            return false;
        }

        for (const coachDetails of this.$props.hiddenCoaches) {
            if (coachDetails.id === offer.away.coach.id) {
                return false;
            }
        }

        return true;
    }

    private offerIsAlreadyPending(offerId: number): boolean {
        for (const pendingOffer of this.pendingOffers) {
            if (pendingOffer.id === offerId) {
                return true;
            }
        }
        return false;
    }

    private createOfferAndAddToPending(offerData) {
        let offer = {
            id: offerData.id,
            expiry: offerData.expiry,
            timeRemaining: offerData.timeRemaining,
            lifetime: offerData.lifetime,
            external: offerData.external,
            home: {
                id: offerData.team1.id,
                team: offerData.team1.name,
                coach: offerData.team1.coach,
                roster: offerData.team1.roster,
                tv: (offerData.team1.teamValue / 1000) + 'k',
                started: offerData.coachNamesStarted.includes(offerData.team1.coach.name),
            },
            away: {
                id: offerData.team2.id,
                team: offerData.team2.name,
                coach: offerData.team2.coach,
                roster: offerData.team2.roster,
                tv: (offerData.team2.teamValue / 1000) + 'k',
                started: offerData.coachNamesStarted.includes(offerData.team2.coach.name),
            }
        };

        if (this.isOfferValid(Date.now(), offer) && !this.offerIsAlreadyPending(offerData.id)) {
            this.pendingOffers.unshift(offer);
        }

        return offer;
    }

    private getMyTeam(myTeamId: number): any {
        for (const myTeam of this.$props.myTeams) {
            if (myTeam.id === myTeamId) {
                return myTeam;
            }
        }
        return null;
    }

    public cancelOffer(offer: any): void {
        this.applyFade(
            () => {
                this.$emit('hide-match', offer.home.id, offer.away.id);
            },
            offer.id,
            500
        );
    }

    public acceptOffer(offer: any): void {
        this.backendApi.sendOffer(offer.home.id, offer.away.id);
    }

    private applyFade(workload: Function, offerId: number, waitTime: number) {
        // set the fadeOutId so that the fade transition class is added to the element
        this.fadeOutId = offerId;

        // allow the transition to happen before other events cause the item to disappear fully.
        setTimeout(() => {
            // run the real workload
            workload();

            // clear the fadeOutId
            if (this.fadeOutId === offerId) {
                this.fadeOutId = null;
            }
        }, waitTime);
    }

    public setUiUpdatesPaused(isPaused: boolean) {
        this.uiUpdatesPaused = isPaused;
    }

    public abbreviate(stringValue: string, maxCharacters: number): string {
        return Util.abbreviate(stringValue, maxCharacters);
    }
}
</script>