class Test {
    guesses: string[]
    constructor() {
        this.guesses = []
    }

    print() {
        console.log(this.guesses)
    }
}

export {
    Test
}

// [!] Error: Unexpected token (Note that you need plugins to import files that are not JavaScript)