import fs from "fs"

fs.readFile("./words.txt", "utf8", (error, _words) => {
    if (error) return console.error(error)

    const words = _words.split(",")
    for (let i = 3; i < 8; i++) {
        const length = i
        const content = words.filter(word => word.length === length).join(",")

        fs.writeFile(`../public/words/word_${i}.txt`, content, error => {
            if (error) return console.error(error)
        })
    }
})