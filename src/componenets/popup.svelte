<script lang="ts">
    import { fade } from "svelte/transition";

    export let onClose: () => void;
    export let customButtons: { message: string; onClick: () => void }[] = null;
</script>

<div class="popup" in:fade out:fade>
    <slot />

    <button on:click={onClose}>Close</button>
    {#if customButtons}
        {#each customButtons as customButton}
            <button on:click={customButton.onClick}
                >{customButton.message}</button
            >
        {/each}
    {/if}
</div>

<style>
    .popup {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #fff;
        border-radius: 5px;
        box-shadow: 5px 10px 18px #888888;
        padding: 10px;

        font-size: large;
    }
</style>
