<script lang="ts">
    import { fade } from "svelte/transition";

    export let message: string;
    export let onClose: () => void;
</script>

<div class="popup" in:fade out:fade>
    <h1>{message}</h1>

    <button on:click={onClose}>Close</button>
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
