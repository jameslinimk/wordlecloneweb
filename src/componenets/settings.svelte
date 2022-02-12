<script lang="ts">
    import { slide } from "svelte/transition";

    let wordLength = 5;
    let tries = 6;
    let daily = false;
</script>

<div class="settings" in:slide out:slide>
    <br />
    <select bind:value={wordLength}>
        {#each Array(5) as _, i}
            <option value={i + 3}>
                {i + 3} letter words {i + 3 === 5 ? "(deafult)" : ""}
            </option>
        {/each}
    </select>
    <select bind:value={tries}>
        {#each Array(7) as _, i}
            <option value={i + 3}>
                {i + 3} tries {i + 3 === 6 ? "(deafult)" : ""}
            </option>
        {/each}
    </select>
    <select bind:value={daily}>
        <option value={true}> Use daily word </option>
        <option value={false}> Don't use daily word (deafult) </option>
    </select>

    <button on:click={() => (window.location.href = `./?wordLength=${wordLength}&maxGuesses=${tries}${daily ? "&word=daily" : ""}`)}><strong>Apply settings (will reset)</strong></button>
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

    :global(body.darkMode) .settings {
        background-color: dimgray;
    }
</style>
