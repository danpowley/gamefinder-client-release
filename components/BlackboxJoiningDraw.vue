<template>
    <div class="blackboxjoiningdraw">
        <div class="goodluck" v-if="isNewDraw && downloadJnlpId !== null">
            <strong>Good luck, your download should begin shortly.</strong> Your match is listed below in the latest Blackbox round.
            If your download fails to start automatically, you can <a :href="`https://fumbbl.com/ffblive.jnlp?id=${downloadJnlpId}`">start the download here</a>.
            <iframe :src="`https://fumbbl.com/ffblive.jnlp?id=${downloadJnlpId}`" height="0" width="0" />
        </div>

        <div v-if="isNewDraw">
            <a href="#" @click.prevent="close">Return to Gamefinder</a>
        </div>

        <template v-if="!isNewDraw">
            <div class="nextdrawverysoon">
                <div style="text-align: center;">The Blackbox draw will take place very soon.</div>
                <div class="timerwrapper"><div class="timer" :style="{ width: (100 * displaySecondsUntilDraw / 30) + '%', left: (50 - 50 * displaySecondsUntilDraw / 30) + '%'}"></div></div>
            </div>
            <div class="previousroundsheader">Previous rounds</div>
        </template>

        <blackboxroundhistory
            :raw-round-history="rawRoundHistory"
            :is-new-draw="isNewDraw"
            :coach-name="coachName"></blackboxroundhistory>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';
import BlackboxRoundHistoryComponent from "./BlackboxRoundHistory.vue";

@Component({
    components: {
        'blackboxroundhistory': BlackboxRoundHistoryComponent,
    },
    props: {
        joiningDraw: {
            validator: function (joiningDraw) {
                return typeof joiningDraw === 'object' || joiningDraw === null;
            }
        },
        rawRoundHistory: {
            type: Object,
            required: true,
        },
        coachName: {
            type: String,
            required: true,
        }
    },
})
export default class BlackboxJoiningDrawComponent extends Vue {
    public get isNewDraw(): boolean {
        return this.$props.joiningDraw.drawnRoundTimestamp !== null;
    }

    public get downloadJnlpId(): number | null {
        return this.$props.joiningDraw.downloadJnlpId;
    }

    public get displaySecondsUntilDraw(): number {
        return this.$props.joiningDraw.displaySecondsUntilDraw;
    }
    
    public close(): void {
        this.$emit('close');
    }
}
</script>