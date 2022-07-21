<template>
    <div v-if="isOpen" class="settingsouter">
        <div class="settingsinner">
            <a href="#" class="closemodal" @click.prevent="close">&times;</a>
            <div class="settingstitle">Gamefinder settings</div>
            <div class="settingssection">
                <div class="title"><strong>Opponent filtering</strong></div>
                <div>
                    <input type="checkbox" v-model="userSettings.showUnofferableTeams" @change="updateShowUnofferableTeams" id="updateshowunofferableteams"> <label for="updateshowunofferableteams">Show all coaches and teams (only applies when not filtering by own team)</label>
                </div>
            </div>
            <div class="settingssection">
                <div class="title"><strong>Alerts</strong></div>
                <div>
                    <input type="checkbox" v-model="userSettings.audio" @change="updateAudioSetting" id="updatesettingaudio"> <label for="updatesettingaudio">Sound alerts enabled</label>
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
            <div class="settingssection">
                <div class="title"><strong>Zen mode</strong></div>
                <div>
                    <input type="checkbox" v-model="userSettings.zenMode" @change="updateZenMode" id="updatezenmode"> <label for="updatezenmode">Zen mode enabled (hides most opponent info)</label>
                </div>
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

    public async updateShowUnofferableTeams() {
        await this.backendApi.setGameFinderVar('gamefinder.showUnofferableTeams', this.$props.userSettings.showUnofferableTeams ? 'Yes' : 'No');
        this.$emit('user-settings-changed');
    }

    public async updateAudioSetting() {
        await this.backendApi.setGameFinderVar('gamefinder.enableSound', this.$props.userSettings.audio ? 'Yes' : 'No');
        this.$emit('user-settings-changed');
    }

    public async updateZenMode() {
        await this.backendApi.setGameFinderVar('gamefinder.zenMode', this.$props.userSettings.zenMode ? 'Yes' : 'No');
        this.$emit('user-settings-changed');
    }
}
</script>