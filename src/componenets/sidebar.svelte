<script lang="ts">
    import Darkmode from "./darkmode.svelte";

    export let game;
    export let toggleSettings: () => void;
    export let zoomOut: () => void;
    export let zoomIn: () => void;

    let timeElapsed = "00:00:00";
    setInterval(() => {
        if (game.endTimer) return;

        timeElapsed = new Date(Date.now() - game.started)
            .toISOString()
            .substr(11, 8);
    }, 1000);
</script>

<div class="sidebar">
    <div style="float:left;">
        <button on:click={zoomOut}>🔎➖</button>
        <button on:click={zoomIn}>🔎➕</button>
    </div>

    <div style="float:right;">
        <Darkmode />
        <button on:click={() => toggleSettings()}>🔨</button>
        <button on:click={() => location.reload()}>🔄</button>
    </div>

    <h3 class="timer">{timeElapsed}</h3>
</div>

<style>
    .sidebar {
        top: 10px;
        right: 10px;
        text-align: right;
    }

    .timer {
        color: gray;
        text-align: center;
        font-size: x-large;
        transition: background-color 0.3s;
    }

    :global(body.dark-mode) .timer {
        color: lightgray;
    }
</style>
