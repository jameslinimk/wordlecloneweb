import { get } from "svelte/store";
import { obscureWord } from "./alphabet";
import { gameWritable } from "./game";
import { instantPopupsWritable } from "./instantpopups";
function copyLink() {
    const instantPopups = get(instantPopupsWritable);
    const game = get(gameWritable);
    navigator.clipboard
        .writeText(game.dailyWord
        ? `${window.location.href.split("?")[0]}?wordLength=${game.wordLength}&maxGuesses=${game.maxGuesses}&word=daily`
        : `${window.location.href.split("?")[0]}?wordLength=${game.wordLength}&maxGuesses=${game.maxGuesses}&word=${obscureWord(game.word)}`)
        .then(() => {
        instantPopups.add("Link copied to clipboard!");
    })
        .catch((err) => {
        console.error(err);
        instantPopups.add("An error has occured!");
    });
}
function copyGame() {
    const instantPopups = get(instantPopupsWritable);
    const game = get(gameWritable);
    const message = [];
    message.push(`Wordimik | ⌚ ${new Date(game.endTimer - game.started).toISOString().substring(14, 19)}s | 📕 "${game.word}"\n`);
    game.boxes.forEach((row, i) => {
        const rowMessage = [];
        row.forEach((box) => {
            switch (box) {
                case "correct":
                    rowMessage.push("🟩");
                    break;
                case "empty":
                    rowMessage.push("⬜");
                    break;
                case "semicorrect":
                    rowMessage.push("🟨");
                    break;
            }
        });
        if (game.guesses[i])
            rowMessage.push(` - ${game.guesses[i]}`);
        message.push(rowMessage.join(""));
    });
    message.push(`
Click the link below to try a game of Wordimik!
${window.location.href.split("?")[0]}?wordLength=${game.wordLength}&maxGuesses=${game.maxGuesses}`);
    navigator.clipboard
        .writeText(message.join("\n"))
        .then(() => {
        instantPopups.add("Link copied to clipboard!");
    })
        .catch((err) => {
        console.error(err);
        instantPopups.add("An error has occured!");
    });
}
export { copyGame, copyLink };
//# sourceMappingURL=sharing.js.map