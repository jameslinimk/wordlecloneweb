<script lang="ts">
    import { slide } from "svelte/transition";
</script>

<div class="settings" in:slide out:slide>
    <p>Test</p>
    <button>Test button</button>
</div>

<style>
    .settings {
        background-color: aliceblue;
        position: absolute;
        top: 0px;
        right: 0px;
        bottom: 0px;
        left: 0px;
    }
</style>
