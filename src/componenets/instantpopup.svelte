<script lang="ts">
    import { fade } from "svelte/transition";

    export let message: string;
    export let duration: number;
    export let destroy: () => void;

    setTimeout(destroy, duration);
</script>

<div class="instantpopup" in:fade out:fade>
    {message}
</div>

<style>
    .instantpopup {
        text-align: center;
        font-size: x-large;
        font-weight: bold;
        width: fit-content;

        background-color: #fff;
        border-radius: 5px;
        box-shadow: 5px 10px 18px #888888;
        padding: 10px;
        margin-bottom: 10px;
    }
</style>
