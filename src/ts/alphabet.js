const alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",];
const keys = {
    "a": "$",
    "b": "&",
    "c": "!",
    "d": "@",
    "e": "#",
    "f": ")",
    "g": "(",
    "h": "0",
    "i": "3",
    "j": "=",
    "k": "[",
    "l": "}",
    "m": "%",
    "n": "{",
    "o": "<",
    "p": ">",
    "q": "_",
    "r": "\\",
    "s": "*",
    "t": "/",
    "u": "?",
    "v": "~",
    "w": "`",
    "x": "'",
    "y": "\"",
    "z": ".",
};
const reverseKeys = Object.keys(keys).reduce(((obj, value) => { obj[keys[value]] = value; return obj; }), {});
const getCode = (letter) => (!letter) ? null : letter.toLowerCase().charCodeAt(0) - 96;
const getLetter = (code) => String.fromCharCode(code + 96);
function obscureWord(word) {
    return word
        .split("")
        .map((letter) => keys[getLetter(getCode(letter))])
        .join("");
}
function unobscureWord(obscureWord) {
    return obscureWord
        .split("")
        .map((code) => getLetter(getCode(reverseKeys[code])))
        .join("");
}
export { alphabet, obscureWord, unobscureWord };
//# sourceMappingURL=alphabet.js.map