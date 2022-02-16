<script lang="ts">
    import { fade } from "svelte/transition";
    import { alphabet, obscureWord } from "../ts/alphabet";
    import { gameWritable } from "../ts/game";
    import { instantPopupsWritable } from "../ts/instantpopups";
    import { stats } from "../ts/stats";
    import Darkmode from "./darkmode.svelte";
    import Popup from "./popup.svelte";

    export let toggleSettings: () => void;
    export let copyLink: () => void;
    export let copyGame: () => void;
    export let barDiv: HTMLDivElement;

    let timeElapsed = "00:00";
    setInterval(() => {
        if ($gameWritable.endTimer) return;
        timeElapsed = new Date(Date.now() - $gameWritable.started).toISOString().substring(14, 19);
    }, 1000);

    let showStats = false;
    let showShareMenu = false;

    export let showWordMenu = false;
    let customWord: string;
    $: customWord = customWord
        ? customWord
              .toLowerCase()
              .split("")
              .filter((letter) => alphabet.includes(letter))
              .join("")
        : customWord;
    let tries = 6;

    const shareCustomWord = async () => {
        if (!customWord) return $instantPopupsWritable.add("Enter something!");
        if (customWord?.length < 3) return $instantPopupsWritable.add("Word has to be more than 3 characters!");
        if (customWord?.length > 7) return $instantPopupsWritable.add("Word has to be less than 7 characters!");

        navigator.clipboard
            .writeText(`${window.location.href.split("?")[0]}?wordLength=${customWord.length}&maxGuesses=${tries}&word=${obscureWord(customWord)}`)
            .then(() => {
                $instantPopupsWritable.add("Link copied to clipboard!");
            })
            .catch((err) => {
                console.error(err);
                $instantPopupsWritable.add("An error has occured!");
            });
    };
</script>

<div class="sidebar" bind:this={barDiv}>
    <div style="position:absolute; left:10px;">
        <button on:click={() => (showWordMenu = !showWordMenu)}>📩</button>
        <Darkmode />
        {#if $gameWritable.endTimer}
            <button in:fade on:click={() => (showShareMenu = !showShareMenu)}>🔗</button>
        {/if}
    </div>

    <div style="position:absolute; right:10px;">
        <button on:click={() => toggleSettings()}>🔨</button>
        <button on:click={() => (showStats = !showStats)}>📊</button>
        <button on:click={() => location.reload()}>🔄</button>
    </div>

    <h3 class="timer">{timeElapsed}</h3>
</div>

{#if showShareMenu}
    <Popup onClose={() => (showShareMenu = false)}>
        <div class="container">
            <h2>Sharing options</h2>
            <button on:click={copyLink}>🔗 Share word (link for others to try your word)</button>
            <button on:click={copyGame}>🔗 Share game (sharing your guesses, word, and time)</button>
        </div>
        <br />
    </Popup>
{/if}

{#if showStats}
    <Popup onClose={() => (showStats = false)}>
        <div class="container">
            <h2>Statistics</h2>
            <div class="stats">
                <div class="stat">
                    <div class="statValue">{$stats.played}</div>
                    <div class="statKey">Played</div>
                </div>
                <div class="stat">
                    <div class="statValue">
                        {Math.round((!($stats.wins / $stats.played) ? 0 : $stats.wins / $stats.played) * 1000) / 10}
                    </div>
                    <div class="statKey">Win %</div>
                </div>
                <div class="stat">
                    <div class="statValue">{$stats.currentStreak}</div>
                    <div class="statKey">Current streak</div>
                </div>
                <div class="stat">
                    <div class="statValue">{$stats.maxStreak}</div>
                    <div class="statKey">Max streak</div>
                </div>
            </div>
        </div>
    </Popup>
{/if}

{#if showWordMenu}
    <Popup onClose={() => (showWordMenu = false)}>
        <div class="container">
            <h2>Share custom word</h2>
            <div style="text-align:center;">Create a copyable link with a custom word to stump your friends (does not have to be a valid word) (3-7 letter words)!</div>
            <br />

            <div>
                <input placeholder="Word" bind:value={customWord} maxlength="7" />
                <select bind:value={tries}>
                    {#each Array(7) as _, i}
                        <option value={i + 3}>
                            {i + 3} tries {i + 3 === 6 ? "(deafult)" : ""}
                        </option>
                    {/each}
                </select> <button on:click={shareCustomWord}>Copy sharable link</button>
            </div>
        </div>
        <br />
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
        text-align: center;
    }

    .timer {
        color: gray;
        /* text-align: center; */
        font-size: x-large;
        /* position: absolute; */
        transition: background-color 0.3s;
    }

    :global(body.darkMode) .timer {
        color: lightgray;
    }
</style>
