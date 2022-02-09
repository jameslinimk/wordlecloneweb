<script lang="ts">
    import { slide } from "svelte/transition";

    export let message: string;
    export let duration: number;
    export let destroy: () => void;

    setTimeout(destroy, duration);
</script>

<div class="instantpopup" in:slide out:slide>
    {message}
</div>

<style>
    .instantpopup {
        position: fixed;
        top: 10%;
        left: 50%;
        transform: translate(-50%, 0);

        text-align: center;
        font-size: xx-large;
        font-weight: bold;
        color: red;
        text-shadow: 2px 2px #000;
    }
</style>
