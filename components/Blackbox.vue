<template>
    <div class="basicbox" v-if="blackbox !== null">
        <div class="header blackboxheader">Blackbox<span class="blackboxstatus">{{ blackbox.status }}</span></div>
        <div class="content" id="blackboxwrapper">
            <a href="#" @click.prevent="openModal('BLACKBOX_ROUNDS')" class="blackboxrounds">{{ lastRoundGameCount.count }} {{ pluralise(lastRoundGameCount.count, 'match', 'matches') }} at {{ lastRoundGameCount.round }}</a>
            <template v-if="blackboxDrawResult === 'NOT_APPLICABLE'">
                <div v-if="blackbox.status === 'Pending'" class="blackboxpaused">
                    Draw taking place.
                </div>
                <div v-else-if="blackbox.status === 'Paused'" class="blackboxpaused">
                    <div class="blackboxtop">
                        Blackbox is paused
                    </div>
                    <div class="timerwrapper"><div class="timer" :style="{ width: (100 * blackbox.secondsRemaining / config.pauseDuration) + '%', left: (50 - 50 * blackbox.secondsRemaining / config.pauseDuration) + '%'}"></div></div>
                    <div class="blackboxbottom">
                        <template v-if="timeRemainingDisplay">
                            Active in {{ timeRemainingDisplay }}
                        </template>
                        <template v-else>
                            Please wait...
                        </template>
                    </div>
                </div>
                <div v-else-if="blackbox.status === 'Active'" class="blackboxactive">
                    <div class="blackboxtop">
                        {{ blackbox.coachCount }} {{ pluralise(blackbox.coachCount, 'coach', 'coaches') }} activated
                    </div>
                    <div class="timerwrapper"><div class="timer" :style="{ width: (100 * blackbox.secondsRemaining / config.activeDuration) + '%', left: (50 - 50 * blackbox.secondsRemaining / config.activeDuration) + '%'}"></div></div>
                    <div class="blackboxbottom">
                        <div class="timeremaining">
                            <template v-if="timeRemainingDisplay">
                                Draw in {{ timeRemainingDisplay }}
                            </template>
                            <template v-else>
                                Please wait...
                            </template>
                        </div>
                        <div class="activationcontrolsouter">
                            <div class="activationcontrolsinner" v-if="blackboxTeamCount > 0">
                                <div v-if="!pleaseWait">
                                    <button v-if="userActivated" @click="handleDeactivation">Leave the Draw</button>
                                    <button v-if="!userActivated" @click="handleActivation">Join the Draw</button>
                                </div>
                                <div v-else>
                                    Please wait {{ pleaseWait }}
                                </div>
                            </div>
                            <div v-else>
                                <template v-if="userActivated">
                                    <strong>0 teams:</strong> 'Choose teams' or <a href="#" @click.prevent="handleDeactivation">leave draw</a>.
                                </template>
                                <template v-else>
                                    Use 'Choose teams' to select valid teams.
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="blackboxpaused">
                    Blackbox is currently offline.
                </div>
            </template>
            <template v-else>
                <div class="drawresult">
                    <div class="drawresultinfo">
                        <template v-if="blackboxDrawResult === 'SCHEDULED'">
                            <div>Match scheduled.</div>
                            <div><a @click.prevent="handleDrawResultDismiss" href="#">View next draw</a></div>
                        </template>
                        <template v-else-if="blackboxDrawResult === 'NOT_SCHEDULED'">
                            <div>Sorry, no match scheduled.</div>
                            <div><a @click.prevent="handleDrawResultDismiss" href="#">View next draw</a></div>
                        </template>
                        <template v-else-if="blackboxDrawResult === 'PREVIOUSLY_SCHEDULED'">
                            <div>PLEASE NOTE: Match scheduled.</div>
                            <div>Check home page for Resume link.</div>
                            <div><a @click.prevent="handleDrawResultDismiss" href="#">Ignore warning</a></div>
                        </template>
                    </div>
                </div>
            </template>
        </div>
        <div class="blackboxtrophy">
            <a href="/p/boxtrophy">Blackbox Trophy</a>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';
import GameFinderHelpers from "../include/GameFinderHelpers";
import IBackendApi from "../include/IBackendApi";
import { BlackboxConfig } from "../include/Interfaces";

@Component({
    props: {
        blackboxTeamCount: {
            type: Number,
            required: true,
        },
        blackbox: {
            validator: function (blackbox) {
                return typeof blackbox === 'object' || blackbox === null;
            }
        },
        lastRoundGameCount: {
            validator: function (lastRoundGameCount) {
                return typeof lastRoundGameCount === 'object';
            }
        },
        blackboxDrawResult: {
            type: String,
            required: true,
        },
        isDevMode: {
            type: Boolean,
            required: true
        },
    },
})
export default class BlackboxComponent extends Vue {
    public pleaseWait: string | null = null;
    public config: BlackboxConfig | null = null;

    private backendApi: IBackendApi;

    public async mounted() {
        this.backendApi = GameFinderHelpers.getBackendApi(this.$props.isDevMode);
        this.config = await this.backendApi.blackboxConfig();
    }

    public get userActivated(): boolean {
        return this.$props.blackbox.userActivated;
    }

    public handleActivation() {
        this.pleaseWait = ' activation in progress.';
        setTimeout(() => { this.pleaseWait = null; }, 3000);
        this.$emit('activated');
    }

    public handleDeactivation() {
        this.pleaseWait = ' deactivation in progress';
        setTimeout(() => { this.pleaseWait = null; }, 3000);
        this.$emit('deactivated');
    }

    public get timeRemainingDisplay(): string {
        if (this.$props.blackbox.secondsRemaining === 0) {
            return '';
        }
        const minutesRemaining = Math.ceil(this.$props.blackbox.secondsRemaining / 60);
        if (minutesRemaining === 1) {
            const approxSecondsRemaining = Math.ceil(this.$props.blackbox.secondsRemaining / 10) * 10;
            return `${approxSecondsRemaining} ${GameFinderHelpers.pluralise(approxSecondsRemaining, 'second', 'seconds')}`;
        }
        return `${minutesRemaining} ${GameFinderHelpers.pluralise(minutesRemaining, 'minute', 'minutes')}`;
    }

    public pluralise(quantity: number, singular: string, plural: string): string {
        return GameFinderHelpers.pluralise(quantity, singular, plural);
    }

    public openModal(name: string, modalSettings: any) {
        this.$emit('open-modal', name, modalSettings);
    }

    public handleDrawResultDismiss() {
        this.$emit('blackbox-draw-result-dismiss');
    }
}
</script>