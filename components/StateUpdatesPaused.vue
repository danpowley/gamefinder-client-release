<template>
    <div v-if="paused" class="stateupdatespausedouter">
        <div class="stateupdatespausedinner">
            <div class="settingstitle">Gamefinder unable to stay up to date</div>
            <div>
                <p>Gamefinder has failed to keep up to date with the latest game data and your teams are no longer available to make / receive offers.</p>
                <p>Please click continue to make your teams available to make and receive offers again.</p>
                <p>Why has this happened?</p>
                <ul>
                    <li>Some browsers impose limits on network activity of a web page after 5 minutes of being 'hidden' (e.g. minimised browser or switched tab).</li>
                    <li>You may be experiencing internet connectivity issues.</li>
                    <li>FUMBBL may be experiencing connectivity issues.</li>
                </ul>
                <div>
                    <a href="#" @click.prevent="continueSession">Continue</a>
                    <a href="https://fumbbl.com" style="margin-left: 20px;">Exit Gamefinder</a>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';

@Component({
    props: {
        paused: {
            type: Boolean,
            required: true
        }
    }
})
export default class StateUpdatesPausedComponent extends Vue {
    public continueSession() {
        this.$emit('continue-session');
    }
}
</script>