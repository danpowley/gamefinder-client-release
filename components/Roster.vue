<template>
    <div v-if="rosterData" class="rosterouter">
        <div class="rosterinner">
            <a href="#" class="closemodal" @click.prevent="close">&times;</a>
            <div class="rosterinfo">{{ abbreviate(rosterData.name, 60) }}, TV {{ rosterData.teamValue/1000 }}k</div>
            <div class="teaminfo">{{ rosterData.rerolls }} RR, {{rosterData.fanFactor}} FF, {{ rosterData.treasury/1000 }}k gold</div>
            <table cellspacing="0" cellpadding="0" width="100%">
            <tr v-for="player in rosterData.players" :key="player.id">
                <td class="position">{{ player.position }}</td><td class="injuries">{{ player.injuries }}</td><td>{{ player.skills }}</td>
            </tr>
            </table>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';
import { Util } from '../../../core/util';
import GameFinderHelpers from "../include/GameFinderHelpers";
import IBackendApi from "../include/IBackendApi";

@Component({
    props: {
        isDevMode: {
            type: Boolean,
            required: true
        },
        team: {
            validator: function (team) {
                return typeof team === 'object' || team === null;
            }
        }
    },
    watch: {
        team: function () {
            // @ts-ignore: Property 'loadRosterData' does not exist on type 'Vue'.
            return this.loadRosterData();
        }
    }
})
export default class RosterComponent extends Vue {
    private backendApi: IBackendApi | null = null;
    public rosterData = null;
    private rosterCache:any = {};

    mounted() {
        this.backendApi = GameFinderHelpers.getBackendApi(this.$props.isDevMode);
    }

    public async loadRosterData() {
        if (this.$props.team === null) {
            this.rosterData = null;
            return;
        }

        const rosterData = await this.getRoster(this.$props.team.id);
        this.rosterData = rosterData;
    }

    public close() {
        this.$emit('close-modal');
    }

    private async getRoster(teamId) {
        let data = this.rosterCache[teamId];

        if (this.rosterCache[teamId] != undefined) {
            if (data.expiry < Date.now()) {
                data = undefined;
            }
        }
        if (data == undefined) {
            const rosterData = await this.backendApi.rosterData(teamId);

            for (const p of rosterData.players) {
                p.skills.sort((a,b) => a.localeCompare(b));
                p.skills = p.skills.join(', ');
            }

            rosterData.players.sort((a,b) => {
                let r = a.position.localeCompare(b.position);
                if (r == 0) {
                    r = b.skills.length - a.skills.length;
                }
                return r;
            });

            data = {
                expiry: Date.now() + 60000,
                roster: rosterData,
            }
            this.rosterCache[teamId] = data;
        }

        return data.roster;
    }

    public abbreviate(stringValue: string, maxCharacters: number) {
        return Util.abbreviate(stringValue, maxCharacters);
    }
}
</script>