"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}
fs_1.default.readFile("./words.txt", "utf8", (error, _words) => {
    if (error)
        return console.error(error);
    const words = _words.split(",");
    for (let i = 3; i < 8; i++) {
        if (i === 5) {
            fs_1.default.readFile("../public/words/word_5_answers.txt", "utf8", (error, _words) => {
                if (error)
                    return console.error(error);
                const shuffled = shuffle(_words.split(","));
                const content = [];
                for (let i = 0; i < 356; i++) {
                    content.push(`${i}|${shuffled[i]}`);
                }
                fs_1.default.writeFile(`../public/words/daily_${i}.txt`, content.join(","), error => {
                    if (error)
                        return console.error(error);
                });
            });
        }
        ;
        const length = i;
        const shuffled = shuffle(words.filter(word => word.length === length));
        const content = [];
        for (let i = 0; i < 356; i++) {
            content.push(`${i}|${shuffled[i]}`);
        }
        fs_1.default.writeFile(`../public/words/daily_${i}.txt`, content.join(","), error => {
            if (error)
                return console.error(error);
        });
    }
});
//# sourceMappingURL=daily.js.map