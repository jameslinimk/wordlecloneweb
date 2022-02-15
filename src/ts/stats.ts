import { get, writable, type Writable } from "svelte/store"

interface Stats {
    played: number
    wins: number
    losses: number
    currentStreak: number
    maxStreak: number
}
const statsKeys = ["played", "wins", "losses", "currentStreak", "maxStreak"]
const stats: Writable<Stats> = writable(<Stats>statsKeys.reduce((acc, curr) => { acc[curr] = 0; return acc }, {}))

const localStats = localStorage.getItem("stats")
if (localStats) {
    let parsedStats: Stats
    try {
        parsedStats = JSON.parse(localStats)
    } catch {
        parsedStats = null
    }
    if (parsedStats) {
        statsKeys.forEach((key) => {
            if (!parsedStats[key] || typeof parsedStats[key] !== "number") {
                parsedStats[key] = 0
            }
        })
        Object.keys(parsedStats).forEach((key) => {
            if (!statsKeys.includes(key)) {
                delete parsedStats[key]
            }
        })
        stats.update(() => parsedStats)
    }

    localStorage.setItem("stats", JSON.stringify(get(stats)))
} else {
    localStorage.setItem("stats", JSON.stringify(get(stats)))
}

function updateStats(newStats: Stats) {
    stats.update(() => newStats)
    localStorage.setItem("stats", JSON.stringify(newStats))
}

export {
    updateStats,
    stats
}

