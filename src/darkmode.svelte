<script lang="ts">
    export let label = "🌓";

    let theme: "dark" | "light" = "light";

    function applyTheme() {
        if (theme === "dark") {
            window.document.body.classList.add("dark-mode");
        } else {
            window.document.body.classList.remove("dark-mode");
        }
    }

    if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
        theme = "dark";
    }

    const localTheme = localStorage.getItem("theme");
    if (localTheme === "light" || localTheme === "dark") {
        theme = localTheme;
    }

    applyTheme();

    function click() {
        if (theme === "dark") {
            theme = "light";
        } else {
            theme = "dark";
        }
        applyTheme();
        console.log(theme);
        localStorage.setItem("theme", theme);
    }
</script>

<button on:click={click}>{label}</button>

<style>
</style>
