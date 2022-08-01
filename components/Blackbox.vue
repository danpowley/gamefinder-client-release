<template>
    <div class="basicbox" v-if="blackbox !== null">
        <div class="header blackboxheader">Blackbox [BETA TESTING]<span class="blackboxstatus">{{ blackbox.status }}</span></div>
        <div class="content" id="blackboxwrapper">
            <a href="#" @click.prevent="openModal('BLACKBOX_ROUNDS')" class="blackboxrounds">Rounds</a>
            <div v-if="zeroSecondsRemaining" class="blackboxpaused">
                Please wait...
            </div>
            <div v-else-if="blackbox.status === 'Paused'" class="blackboxpaused">
                <div class="blackboxtop">
                    Blackbox is paused
                </div>
                <div class="timerwrapper"><div class="timer" :style="{ width: (100 * blackbox.secondsRemaining / config.pauseDuration) + '%', left: (50 - 50 * blackbox.secondsRemaining / config.pauseDuration) + '%'}"></div></div>
                <div class="blackboxbottom">
                    Active in {{ timeRemainingDisplay }}
                </div>
            </div>
            <div v-else-if="blackbox.status === 'Active'" class="blackboxactive">
                <div class="blackboxtop">
                    {{ blackbox.coachCount }} {{ pluralise(blackbox.coachCount, 'coach', 'coaches') }} activated
                </div>
                <div class="timerwrapper"><div class="timer" :style="{ width: (100 * blackbox.secondsRemaining / config.activeDuration) + '%', left: (50 - 50 * blackbox.secondsRemaining / config.activeDuration) + '%'}"></div></div>
                <div class="blackboxbottom">
                    <div class="timeremaining">
                        Draw in {{ timeRemainingDisplay }}
                    </div>
                    <div class="activationcontrolsouter">
                        <div class="activationcontrolsinner" v-if="hasBlackboxTeamsActivated">
                            <div v-if="!pleaseWait">
                                <button v-if="userActivated" type="checkbox" @click="handleDeactivation">Deactivate my teams</button>
                                <button v-if="!userActivated" type="checkbox" @click="handleActivation">Activate my teams</button>
                            </div>
                            <div v-else>
                                Please wait {{ pleaseWait }}
                            </div>
                        </div>
                        <div v-else>
                            Use 'Choose teams' to select valid teams.
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="blackboxpaused">
                Blackbox is currently offline.
            </div>
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
        hasBlackboxTeamsActivated: {
            type: Boolean,
            required: true,
        },
        blackbox: {
            validator: function (blackbox) {
                return typeof blackbox === 'object' || blackbox === null;
            }
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
        this.backendApi.blackboxActivate();
    }

    public handleDeactivation() {
        this.pleaseWait = ' deactivation in progress';
        setTimeout(() => { this.pleaseWait = null; }, 3000);
        this.backendApi.blackboxDeactivate();
    }

    public get zeroSecondsRemaining(): boolean {
        return this.$props.blackbox.secondsRemaining === 0;
    }

    public get timeRemainingDisplay(): string {
        if (this.zeroSecondsRemaining) {
            return '';
        }
        const minutesRemaining = Math.ceil(this.$props.blackbox.secondsRemaining / 60);
        if (minutesRemaining === 1) {
            const approxSecondsRemaining = Math.ceil(this.$props.blackbox.secondsRemaining / 10) * 10;
            return `${approxSecondsRemaining} ${GameFinderHelpers.pluralise(approxSecondsRemaining, 'second', 'seconds')}`;
        }
        return `${minutesRemaining} minute${GameFinderHelpers.pluralise(minutesRemaining, 'minute', 'minutes')}`;
    }

    public pluralise(quantity: number, singular: string, plural: string): string {
        return GameFinderHelpers.pluralise(quantity, singular, plural);
    }

    public openModal(name: string, modalSettings: any) {
        this.$emit('open-modal', name, modalSettings);
    }
}
</script>