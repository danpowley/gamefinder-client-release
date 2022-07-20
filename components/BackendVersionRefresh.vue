<template>
    <div v-if="refreshRequired" class="backendversionrefreshouter">
        <div class="backendversionrefreshinner">
            <div class="settingstitle">Gamefinder update, refresh required.</div>
            <div>
                <p>
                    Apologies for the inconvenience, the Gamefinder system has just been updated and you need to refresh your browser in order to continue.
                </p>
                <p>
                    We will refresh the page automatically in 30 seconds, or click the link below to reload now.
                </p>
                <div>
                    <a href="#" @click.prevent="reload">Reload now</a>
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
        refreshRequired: {
            type: Boolean,
            required: true
        }
    }
})
export default class BackendVersionRefreshComponent extends Vue {
    public reload() {
        window.location.reload();
    }
}
</script>