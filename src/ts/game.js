import { get, writable } from "svelte/store";
import { alphabet } from "./alphabet";
import { instantPopupsWritable } from "./instantpopups";
class Game {
    constructor(wordLength, maxGuesses, guessesList, answersList, customWord = false, dailyWord = false) {
        this.wordLength = wordLength;
        this.maxGuesses = maxGuesses;
        this.guessesList = guessesList;
        this.answersList = answersList;
        this.dailyWord = dailyWord;
        const instantPopups = get(instantPopupsWritable);
        this.guesses = [];
        this.boxes = [...Array(maxGuesses)].map(() => [...Array(wordLength)].map(() => "empty"));
        if (customWord && dailyWord) {
            console.log("📝 Using daily word!");
            if (instantPopups)
                instantPopups.add("Daily word detected & used!");
            this.word = customWord;
        }
        else if (customWord && guessesList.includes(customWord)) {
            console.log("📝 Custom word detected!");
            if (instantPopups)
                instantPopups.add("Custom word detected & used!");
            this.word = customWord;
        }
        else {
            this.word =
                answersList[Math.floor(Math.random() * answersList.length)];
        }
        this.started = Date.now();
        this.endTimer = false;
        this.keyboardColors = {};
        alphabet.forEach((letter) => (this.keyboardColors[letter] = "none"));
        if (this.word)
            console.log(`Word is "${this.word}" (cheater 👀)`);
    }
    getColor(color, keyboard = false) {
        switch (color) {
            case "correct":
                return "#AFE1AF";
            case "empty":
                return keyboard ? "dimgrey" : "#D3D3D3";
            case "semicorrect":
                return "#FFC300";
            case "none":
                return "";
        }
    }
    get coloredBoxes() {
        return this.boxes.map((row) => row.map((color) => this.getColor(color)));
    }
    validateInput(input) {
        if (!input)
            return "Enter something!";
        if ((input === null || input === void 0 ? void 0 : input.length) < this.wordLength)
            return "Input too short!";
        if ((input === null || input === void 0 ? void 0 : input.length) > this.wordLength)
            return "Input too long!";
        if (this.guesses.includes(input))
            return "Don't waste your guesses!";
        if (!this.guessesList.includes(input))
            return `"${input}" is not a valid word!`;
        return true;
    }
}
const gameWritable = writable(new Game(0, 0, [], []));
export { Game, gameWritable };
//# sourceMappingURL=game.js.map