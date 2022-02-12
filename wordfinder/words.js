"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
fs_1.default.readFile("./words.txt", "utf8", (error, _words) => {
    if (error)
        return console.error(error);
    const words = _words.split(",");
    for (let i = 3; i < 8; i++) {
        const length = i;
        const content = words.filter(word => word.length === length).join(",");
        fs_1.default.writeFile(`../public/words/word_${i}.txt`, content, error => {
            if (error)
                return console.error(error);
        });
    }
});
//# sourceMappingURL=words.js.map