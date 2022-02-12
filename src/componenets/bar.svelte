<script lang="ts">
    import { fade } from "svelte/transition";
    import Darkmode from "./darkmode.svelte";
    import Popup from "./popup.svelte";

    export let game;
    export let toggleSettings: () => void;
    export let zoomOut: () => void;
    export let zoomIn: () => void;
    export let copyLink: () => void;
    export let copyGame: () => void;
    export let getStats: () => {
        played: number;
        wins: number;
        losses: number;
        currentStreak: number;
        maxStreak: number;
    };

    let timeElapsed = "00:00:00";
    setInterval(() => {
        if (game.endTimer) return;

        timeElapsed = new Date(Date.now() - game.started)
            .toISOString()
            .substr(11, 8);
    }, 1000);

    let showStats = false;
</script>

<div class="sidebar">
    <div style="float:left;">
        <button on:click={zoomOut}>🔎➖</button>
        <button on:click={zoomIn}>🔎➕</button>
    </div>

    <div style="float:right;">
        {#if game.endTimer}
            <button in:fade on:click={copyLink}>Share your word</button>
            <button in:fade on:click={copyGame}>Share this game</button>
        {/if}
        <Darkmode />
        <button on:click={() => toggleSettings()}>🔨</button>
        <button on:click={() => location.reload()}>🔄</button>
        <button on:click={() => (showStats = !showStats)}>📊</button>
    </div>

    <h3 class="timer">{timeElapsed}</h3>
</div>

{#if showStats}
    <Popup onClose={() => (showStats = false)}>
        <div class="container">
            <h2>Statistics</h2>
            <div class="stats">
                <div class="stat">
                    <div class="statValue">{getStats().played}</div>
                    <div class="statKey">Played</div>
                </div>
                <div class="stat">
                    <div class="statValue">
                        {Math.round(
                            (getStats().wins / getStats().played) * 1000
                        ) / 10}
                    </div>
                    <div class="statKey">Win %</div>
                </div>
                <div class="stat">
                    <div class="statValue">{getStats().currentStreak}</div>
                    <div class="statKey">Current streak</div>
                </div>
                <div class="stat">
                    <div class="statValue">{getStats().maxStreak}</div>
                    <div class="statKey">Max streak</div>
                </div>
            </div>
        </div>
    </Popup>
{/if}

<style>
    .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .stats {
        display: flex;
        margin-bottom: 10px;
    }

    .stat {
        flex: 1;
        flex-grow: 1;
        flex-shrink: 1;
        flex-basis: 0%;
        padding-left: 10px;
        padding-right: 10px;
    }

    .statValue {
        font-size: 36px;
        font-weight: 400;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        letter-spacing: 0.05em;
        /* font-variant-numeric: proportional-nums; */
    }

    .statKey {
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
    }

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

    :global(body.darkMode) .timer {
        color: lightgray;
    }
</style>
