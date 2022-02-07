<script lang="ts">
    import { slide } from "svelte/transition";
</script>

<div class="settings" in:slide out:slide>
    <br />
    <select>
        {#each Array(5) as _, i}
            {#if i + 3 === 5}
                <option selected value={i + 3}>
                    {i + 3} letter words (deafult)
                </option>
            {:else}
                <option value={i + 3}>
                    {i + 3} letter words
                </option>
            {/if}
        {/each}
    </select>
    <select>
        {#each Array(7) as _, i}
            {#if i + 3 === 6}
                <option selected value={i + 3}>
                    {i + 3} tries (deafult)
                </option>
            {:else}
                <option value={i + 3}> {i + 3} tries </option>
            {/if}
        {/each}
    </select>

    <button><strong>Apply settings (will reset)</strong></button>
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
