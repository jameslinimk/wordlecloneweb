import fs from "fs"

function shuffle(array: any[]) {
    let currentIndex = array.length, randomIndex

    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
    }

    return array
}

fs.readFile("./words.txt", "utf8", (error, _words) => {
    if (error) return console.error(error)

    const words = _words.split(",")
    for (let i = 3; i < 8; i++) {
        if (i === 5) {
            fs.readFile("../public/words/word_5_answers.txt", "utf8", (error, _words) => {
                if (error) return console.error(error)

                const shuffled = shuffle(_words.split(","))
                const content = []
                for (let i = 0; i < 356; i++) {
                    content.push(`${i}|${shuffled[i]}`)
                }

                fs.writeFile(`../public/words/daily_${i}.txt`, content.join(","), error => {
                    if (error) return console.error(error)
                })
            })
        };

        const length = i
        const shuffled = shuffle(words.filter(word => word.length === length))
        const content = []
        for (let i = 0; i < 356; i++) {
            content.push(`${i}|${shuffled[i]}`)
        }

        fs.writeFile(`../public/words/daily_${i}.txt`, content.join(","), error => {
            if (error) return console.error(error)
        })
    }
})