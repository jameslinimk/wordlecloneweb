const alphabet = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
];
function obscureWord(word) {
    return word
        .split("")
        .map((letter) => (letter.toLowerCase().charCodeAt(0) - 96) * 2 + 3)
        .join("|");
}
function unobscureWord(obscureWord) {
    return obscureWord
        .split("|")
        .map((number) => String.fromCharCode(96 + (parseInt(number) - 3) / 2))
        .join("");
}
export { alphabet, obscureWord, unobscureWord };
//# sourceMappingURL=alphabet.js.map