<template>
    <div v-if="isOpen" class="blackboxroundhistoryouter">
        <div class="blackboxroundhistoryinner">
            <a href="#" class="closemodal" @click.prevent="close">&times;</a>
            <div class="settingstitle">
                Blackbox round history
            </div>
            <blackboxroundhistory
                :raw-round-history="rawRoundHistory"
                :is-new-draw="false"
                :coach-name="coachName"></blackboxroundhistory>
        </div>
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
        isOpen: {
            type: Boolean,
            required: true,
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
export default class TeamSettingsComponent extends Vue {
    public close() {
        this.$emit('close-modal');
    }
}
</script>