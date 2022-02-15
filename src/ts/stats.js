import { get, writable } from "svelte/store";
const statsKeys = ["played", "wins", "losses", "currentStreak", "maxStreak"];
const stats = writable(statsKeys.reduce((acc, curr) => { acc[curr] = 0; return acc; }, {}));
const localStats = localStorage.getItem("stats");
if (localStats) {
    let parsedStats;
    try {
        parsedStats = JSON.parse(localStats);
    }
    catch (_a) {
        parsedStats = null;
    }
    if (parsedStats) {
        statsKeys.forEach((key) => {
            if (!parsedStats[key] || typeof parsedStats[key] !== "number") {
                parsedStats[key] = 0;
            }
        });
        Object.keys(parsedStats).forEach((key) => {
            if (!statsKeys.includes(key)) {
                delete parsedStats[key];
            }
        });
        stats.update(() => parsedStats);
    }
    localStorage.setItem("stats", JSON.stringify(get(stats)));
}
else {
    localStorage.setItem("stats", JSON.stringify(get(stats)));
}
function updateStats(newStats) {
    stats.update(() => newStats);
    localStorage.setItem("stats", JSON.stringify(newStats));
}
export { updateStats, stats };
//# sourceMappingURL=stats.js.map