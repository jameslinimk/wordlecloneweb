import { writable } from "svelte/store"
import { alphabet } from "./alphabet"
import type { InstantPopups } from "./instantpopups"

class Game {
    guesses: string[]
    boxes: ("empty" | "correct" | "semicorrect")[][]

    getColor(
        color: "empty" | "correct" | "semicorrect" | "none",
        keyboard = false
    ) {
        switch (color) {
            case "correct":
                return "#AFE1AF"
            case "empty":
                return keyboard ? "dimgrey" : "#D3D3D3"
            case "semicorrect":
                return "#FFC300"
            case "none":
                return ""
        }
    }
    get coloredBoxes() {
        return this.boxes.map((row) =>
            row.map((color) => this.getColor(color))
        )
    }
    keyboardColors: {
        [key: string]: "none" | "empty" | "correct" | "semicorrect"
    }
    word: string
    started: number
    endTimer: false | number
    constructor(
        public wordLength: number,
        public maxGuesses: number,
        public guessesList: string[],
        public answersList: string[],
        instantPopups?: InstantPopups,
        customWord: false | string = false,
        public dailyWord = false,
    ) {
        this.guesses = []
        this.boxes = [...Array(maxGuesses)].map(() =>
            [...Array(wordLength)].map(() => "empty")
        )
        if (customWord && dailyWord) {
            console.log("📝 Using daily word!")
            if (instantPopups) instantPopups.add("Daily word detected & used!")
            this.word = customWord
        } else if (customWord && guessesList.includes(customWord)) {
            console.log("📝 Custom word detected!")
            if (instantPopups) instantPopups.add("Custom word detected & used!")
            this.word = customWord
        } else {
            this.word =
                answersList[Math.floor(Math.random() * answersList.length)]
        }
        this.started = Date.now()
        this.endTimer = false
        this.keyboardColors = {}
        alphabet.forEach(
            (letter) => (this.keyboardColors[letter] = "none")
        )
        if (this.word) console.log(`Word is "${this.word}" (cheater 👀)`)
    }

    validateInput(input: string) {
        if (!input) return "Enter something!"
        if (input?.length < this.wordLength) return "Input too short!"
        if (input?.length > this.wordLength) return "Input too long!"
        if (this.guesses.includes(input))
            return "Don't waste your guesses!"
        if (!this.guessesList.includes(input))
            return `"${input}" is not a valid word!`
        return true
    }
}

const gameWritable = writable(new Game(0, 0, [], []))

export {
    Game,
    gameWritable
}

