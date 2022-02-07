<script lang="ts">
    import { slide } from "svelte/transition";
    import Darkmode from "./darkmode.svelte";

    export let closeSettings: () => void;
</script>

<div class="settings" in:slide out:slide>
    <button on:click={closeSettings}>❌</button>
    <br />
    <Darkmode label="Toggle dark mode" />
</div>

<style>
    .settings {
        background-color: aliceblue;
        position: absolute;
        top: 0px;
        right: 0px;
        bottom: 0px;
        left: 0px;
        width: 250px;
        padding: 10px;
        transition: background-color 0.3s;
    }

    :global(body.dark-mode) .settings {
        background-color: dimgray;
    }
</style>
