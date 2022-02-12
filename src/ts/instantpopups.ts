import { writable } from "svelte/store"

class InstantPopups {
    popups: { [key: string]: { message: string, delay: number } }
    id: number
    update: boolean
    constructor() {
        this.popups = {}
        this.id = 0
        this.update = false
    }

    remove(id: string) {
        delete this.popups[id]
        this.update = !this.update
        instantPopupsWritable.update((i) => i)
    }

    add(message: string, delay = 2000) {
        this.popups[this.id] = { message, delay }
        this.id += 1
        this.update = !this.update
        console.log("added", this.popups, this.id, this.update)
        instantPopupsWritable.update((i) => i)
    }
}

const instantPopupsWritable = writable(new InstantPopups())

export {
    InstantPopups,
    instantPopupsWritable
}

