import { writable } from "svelte/store";
class InstantPopups {
    constructor() {
        this.popups = {};
        this.id = 0;
        this.update = false;
    }
    remove(id) {
        delete this.popups[id];
        this.update = !this.update;
        instantPopupsWritable.update((i) => i);
    }
    add(message, delay = 2000) {
        this.popups[this.id] = { message, delay };
        this.id += 1;
        this.update = !this.update;
        instantPopupsWritable.update((i) => i);
    }
}
const instantPopupsWritable = writable(new InstantPopups());
export { InstantPopups, instantPopupsWritable };
//# sourceMappingURL=instantpopups.js.map