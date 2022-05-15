<template>
    <div v-if="isOpen" class="settingsouter">
        <div class="settingsinner">
            <a href="#" class="closemodal" @click.prevent="close">&times;</a>
            <div class="settingstitle">Gamefinder settings for ALL teams</div>
            <div class="settingssection">
                <div class="title"><strong>Audio settings</strong></div>
                <div>
                    <input type="checkbox" v-model="userSettings.audio" @change="updateAudioSetting" id="updatesettingaudio"> <label for="updatesettingaudio">Sound alerts enabled.</label>
                </div>
            </div>
            <div class="settingssection">
                <div class="title"><strong>Hidden coaches:</strong></div>
                <template v-if="userSettings.hiddenCoaches.length === 0">
                    <div>No coaches currently hidden.</div>
                </template>
                <template v-else>
                    <div v-for="coach in userSettings.hiddenCoaches" :key="coach.id">
                        <a href="#" @click.prevent="unhideCoach(coach)">unhide</a> {{ coach.name }}
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';
import GameFinderHelpers from '../include/GameFinderHelpers';
import IBackendApi from "../include/IBackendApi";

@Component({
    props: {
        isDevMode: {
            type: Boolean,
            required: true
        },
        isOpen: {
            type: Boolean,
            required: true
        },
        userSettings: {
            validator: function (userSettings) {
                return typeof userSettings === 'object' || userSettings === null;
            }
        }
    }
})
export default class SettingsComponent extends Vue {
    private backendApi: IBackendApi | null = null;
    public coachNameToHide: string = '';

    mounted() {
        this.backendApi = GameFinderHelpers.getBackendApi(this.$props.isDevMode);
    }

    public unhideCoach(id: number) {
        this.$emit('unhide-coach', id);
    }

    public close() {
        this.$emit('close-modal');
    }

    public async updateAudioSetting() {
        await this.backendApi.setGameFinderVar('gamefinder.enableSound', this.$props.userSettings.audio ? 'Yes' : 'No');
        this.$emit('user-settings-changed');
    }
}
</script>