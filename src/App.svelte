<script lang="ts">
	import { scale } from "svelte/transition";
	import Popup from "./componenets/popup.svelte";
	import Settings from "./componenets/settings.svelte";
	import Sidebar from "./componenets/sidebar.svelte";
	import Keyboard from "./componenets/keyboard.svelte";
	import InstantPopup from "./componenets/instantpopup.svelte";

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

	/* ---------------------------------- Game ---------------------------------- */
	class Game {
		guesses: string[];
		boxes: ("empty" | "correct" | "semicorrect")[][];

		getColor(
			color: "empty" | "correct" | "semicorrect" | "none",
			keyboard = false
		) {
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
			return this.boxes.map((row) =>
				row.map((color) => this.getColor(color))
			);
		}
		keyboardColors: {
			[key: string]: "none" | "empty" | "correct" | "semicorrect";
		};
		word: string;
		started: number;
		endTimer: boolean;
		constructor(
			public wordLength: number,
			public maxGuesses: number,
			public guessesList: string[],
			public answersList: string[],
			customWord: false | string = false
		) {
			this.guesses = [];
			this.boxes = [...Array(maxGuesses)].map(() =>
				[...Array(wordLength)].map(() => "empty")
			);
			if (customWord && guessesList.includes(customWord)) {
				console.log("📝 Custom word detected!");
				addInstantPopup("Custom word detected & used!");
				this.word = customWord;
			} else {
				this.word =
					answersList[Math.floor(Math.random() * answersList.length)];
			}
			this.started = Date.now();
			this.endTimer = false;
			this.keyboardColors = {};
			alphabet.forEach(
				(letter) => (this.keyboardColors[letter] = "none")
			);
			if (this.word) console.log(`Word is "${this.word}" (cheater 👀)`);
		}

		validateInput(input: string) {
			if (!input) return "Enter something!";
			if (input?.length < this.wordLength) return "Input too short!";
			if (input?.length > this.wordLength) return "Input too long!";
			if (this.guesses.includes(input))
				return "Don't waste your guesses!";
			if (!this.guessesList.includes(input))
				return `"${input}" is not a valid word!`;
			return true;
		}
	}

	let wordLength = 5;
	let maxGuesses = 6;

	const searchParams = new URLSearchParams(window.location.search);
	if (
		searchParams.has("wordLength") &&
		!isNaN(<any>searchParams.get("wordLength")) &&
		parseInt(searchParams.get("wordLength")) >= 3 &&
		parseInt(searchParams.get("wordLength")) <= 7
	) {
		const _wordLength = parseInt(searchParams.get("wordLength"));
		wordLength = _wordLength;
	}

	if (
		searchParams.has("maxGuesses") &&
		!isNaN(<any>searchParams.get("maxGuesses")) &&
		parseInt(searchParams.get("maxGuesses")) >= 3 &&
		parseInt(searchParams.get("maxGuesses")) <= 9
	) {
		const _maxGuesses = parseInt(searchParams.get("maxGuesses"));
		maxGuesses = _maxGuesses;
	}

	function obscureWord(word: string): string {
		return word
			.split("")
			.map((letter) => (letter.toLowerCase().charCodeAt(0) - 96) * 2 + 3)
			.join("|");
	}

	function unobscureWord(obscureWord: string): string {
		return obscureWord
			.split("|")
			.map((number) =>
				String.fromCharCode(96 + (parseInt(number) - 3) / 2)
			)
			.join("");
	}

	let customWord: false | string = false;
	if (searchParams.has("word")) {
		customWord = unobscureWord(searchParams.get("word"));
		if (customWord.length !== wordLength) customWord = false;
	}

	async function start() {
		let _guesses: string[];
		let _answers: string[];

		const _words = await fetch(`./words/word_${wordLength}.txt`);
		const words = await _words.text();
		_guesses = words.split(",");
		if (wordLength !== 5) {
			_answers = words.split(",");
		}

		if (wordLength === 5) {
			const _words = await fetch(
				`./words/word_${wordLength}_answers.txt`
			);
			const words = await _words.text();
			_answers = words.split(",");
		}

		return [_guesses, _answers];
	}

	let game = new Game(0, 0, [], []);

	const guessesAnswers = start();
	guessesAnswers.then((guessesAnswers) => {
		const guesses = guessesAnswers[0];
		const answers = guessesAnswers[1];

		game = new Game(wordLength, maxGuesses, guesses, answers, customWord);
	});

	function processInput() {
		if (game.validateInput(input) !== true) return;

		/* ---------------------------- Reset / add input --------------------------- */
		game.guesses = [...game.guesses, input];

		/* -------------------------- Determine the colors -------------------------- */
		const foundindexes = [];
		for (let i = 0; i < input.length; i++) {
			const letter = input[i];
			const index = game.word.indexOf(letter);

			if (index === -1) {
				game.boxes[game.guesses.length - 1][i] = "empty";
				if (
					game.keyboardColors[letter] !== "correct" &&
					game.keyboardColors[letter] !== "semicorrect"
				) {
					game.keyboardColors[letter] = "empty";
				}
				continue;
			}

			if (game.word[i] === letter) {
				game.boxes[game.guesses.length - 1][i] = "correct";
				game.keyboardColors[letter] = "correct";
				continue;
			}

			let found = false;
			for (let i = 0; i < input.length; i++) {
				if (game.word[i] === input[i] && input[i] === letter) {
					found = true;
					break;
				}
			}

			if (found) {
				game.boxes[game.guesses.length - 1][i] = "empty";
				if (
					game.keyboardColors[letter] !== "correct" &&
					game.keyboardColors[letter] !== "semicorrect"
				) {
					game.keyboardColors[letter] = "empty";
				}
				continue;
			}

			if (!foundindexes.includes(index)) {
				game.boxes[game.guesses.length - 1][i] = "semicorrect";
				if (game.keyboardColors[letter] !== "correct") {
					game.keyboardColors[letter] = "semicorrect";
				}
				foundindexes.push(index);
				continue;
			}

			game.boxes[game.guesses.length - 1][i] = "empty";
			if (
				game.keyboardColors[letter] !== "correct" &&
				game.keyboardColors[letter] !== "semicorrect"
			) {
				game.keyboardColors[letter] = "empty";
			}
		}

		/* ------------------------------- Win / lose ------------------------------- */
		if (input === game.word) {
			won = true;
			game.endTimer = true;
		} else if (game.guesses.length >= game.maxGuesses) {
			lose = true;
			game.endTimer = true;
		}

		input = "";
	}

	/* --------------------------------- Inputs --------------------------------- */
	let input = "";
	$: inputValid = !won
		? !lose
			? game.validateInput(input)
			: `You lost, the word was ${game.word}!`
		: "You won!";

	function keyboardPress(key: string) {
		if (key === "backspace") {
			input = input.slice(0, -1);
		} else if (key == "Enter") {
			if (inputValid !== true) {
				addInstantPopup(inputValid.toString());
			}
			processInput();
		} else if (input.length <= game.wordLength - 1) {
			input = `${input}${key}`;
		}
	}

	document.onkeyup = (event) => {
		if (event.code === "Escape") settingsOpen = !settingsOpen;
		else if (event.code === "Equal") zoomIn();
		else if (event.code === "Minus") zoomOut();
		else if (event.code === "Backspace") {
			input = input.slice(0, -1);
		} else if (event.code === "Enter") {
			if (inputValid !== true) {
				addInstantPopup(inputValid.toString());
			}
			processInput();
		} else if (
			alphabet.includes(event.key.toLowerCase()) &&
			input.length <= game.wordLength - 1
		) {
			input = `${input}${event.key}`;
		}
	};

	/* --------------------------------- Popups --------------------------------- */
	let won = false;
	let closedWonPopup = false;
	function closeWonPopup() {
		closedWonPopup = true;
	}

	let lose = false;
	let closedLosePopup = false;
	function closeLosePopup() {
		closedLosePopup = true;
	}

	let instantPopups: { [key: string]: { message: string; delay: number } } =
		{};
	let instantPopupId = 0;
	let instantPopupUpdate = false;
	function removeInstantPopup(id: string) {
		delete instantPopups[id];
		instantPopupUpdate = !instantPopupUpdate;
	}
	function addInstantPopup(message: string, delay = 1500) {
		instantPopups[instantPopupId] = { message, delay };
		instantPopupId += 1;
	}

	/* -------------------------------- Settings -------------------------------- */
	let settingsOpen = false;

	/* ---------------------------------- Zoom ---------------------------------- */
	let gameDiv /*: HTMLDivElement*/; // Because for some reason style.zoom isnt a thing
	$: {
		if (gameDiv?.style) {
			const localZoom = localStorage.getItem("zoom");
			if (localZoom && !isNaN(<any>localZoom)) {
				gameDiv.style.zoom = parseFloat(localZoom);
			}
		}
	}
	function zoomIn() {
		const style: any = getComputedStyle(gameDiv);
		gameDiv.style.zoom = parseFloat(style.zoom) + 0.05;
		localStorage.setItem("zoom", `${parseFloat(style.zoom) + 0.05}`);
	}
	function zoomOut() {
		const style: any = getComputedStyle(gameDiv);
		gameDiv.style.zoom = parseFloat(style.zoom) - 0.05;
		localStorage.setItem("zoom", `${parseFloat(style.zoom) - 0.05}`);
	}
</script>

<main>
	<Sidebar
		{game}
		{zoomIn}
		{zoomOut}
		toggleSettings={() => (settingsOpen = !settingsOpen)}
	/>

	{#if game.wordLength !== 0}
		<!-- Game -->
		<div
			class="game"
			style="--max-guesses: {game.maxGuesses}; --word-length: {game.wordLength}"
			bind:this={gameDiv}
		>
			{#each game.coloredBoxes as _row, row}
				{#each _row as _, column}
					{#if game.guesses[row]}
						{#key game.guesses[row].charAt(column).toUpperCase()}
							<div
								class="box noBorder"
								style="--color: {_row[column]}"
								transition:scale={{ delay: 200 * column }}
							>
								{game.guesses[row][column].toUpperCase()}
							</div>
						{/key}
					{:else}
						<div class="box">
							{input?.[column] && game.guesses.length === row
								? input?.[column]?.toUpperCase()
								: ""}
						</div>
					{/if}
				{/each}
			{/each}
		</div>

		<!-- Input -->
		<div class="input"><Keyboard {game} {keyboardPress} /></div>
	{/if}

	<!-- Settings -->
	{#if settingsOpen}
		<Settings />
	{/if}

	{#key instantPopupUpdate}
		{#each Object.keys(instantPopups) as key}
			<InstantPopup
				message={instantPopups[key].message}
				duration={instantPopups[key].delay}
				destroy={() => removeInstantPopup(key)}
			/>
		{/each}
	{/key}

	<!-- Win / lose popups -->
	{#if won && !closedWonPopup}
		<Popup
			message="🎉 You won {game.guesses.length === 1
				? 'first try! (hacker)'
				: `in ${game.guesses.length} tries!`}"
			onClose={closeWonPopup}
			customButton={{
				message: "Share your word!",
				onClick: () => {
					navigator.clipboard
						.writeText(
							`${window.location.href
								.split("?")[0]
								.slice(0, -1)}?wordLength=${
								game.wordLength
							}&maxGuesses=${game.maxGuesses}&word=${obscureWord(
								game.word
							)}`
						)
						.then(() => {
							addInstantPopup("Link copied to clipboard!");
						})
						.catch((err) => {
							console.error(err);
							addInstantPopup("An error has occured!");
						});
				},
			}}
		/>
	{/if}

	{#if lose && !closedLosePopup}
		<Popup
			message="🎈 You lost, the word was {game.word}!"
			onClose={closeLosePopup}
			customButton={{
				message: "Share your word!",
				onClick: () => {
					navigator.clipboard
						.writeText(
							`${window.location.href
								.split("?")[0]
								.slice(0, -1)}?wordLength=${
								game.wordLength
							}&maxGuesses=${game.maxGuesses}&word=${obscureWord(
								game.word
							)}`
						)
						.then(() => {
							addInstantPopup("Link copied to clipboard!");
						})
						.catch((err) => {
							console.error(err);
							addInstantPopup("An error has occured!");
						});
				},
			}}
		/>
	{/if}

	<svg
		class="githubIco"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill-opacity="0.6"
		on:click={() =>
			window.open(
				"https://github.com/jameslinimk/wordlecloneweb",
				"_blank"
			)}
		><path
			d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
		/></svg
	>
</main>

<style>
	.githubIco {
		position: absolute;
		bottom: 10px;
		right: 10px;
		background-color: whitesmoke;
		padding: 2px;
		border-radius: 5px;
		opacity: 0.6;
		transition: 0.3s;
	}

	.githubIco:hover {
		opacity: 1;
		cursor: pointer;
	}

	* {
		touch-action: manipulation;
	}

	.input {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 15px;
	}

	.game {
		display: grid;
		zoom: 100%;

		grid-template-columns: repeat(var(--word-length), 100px);
		grid-template-rows: repeat(var(--max-guesses), 100px);
		gap: 10px;

		/* aspect-ratio: 1/1; */

		/* height: 500px; */

		justify-content: center;
		align-content: center;
		/* margin-bottom: 20px; */
	}

	.box {
		background-color: var(--color);
		border-radius: 2px;
		border-style: solid;
		border-color: grey;
		border-width: 4px;

		font-size: 300%;
		color: grey;

		display: flex;
		justify-content: center;
		align-items: center;
	}

	.noBorder {
		border-width: 0;
	}

	:global(body.darkMode) .box {
		border-color: grey;
		color: white;
	}

	/* ------------------------------- Background ------------------------------- */
	:global(body) {
		background-color: #fff;
		transition: background-color 0.3s;
	}

	:global(body.darkMode) {
		background-color: #1a1a1b;
	}

	:global([data-tooltip]) {
		position: relative;
		z-index: 2;
		display: block;
	}

	:global([data-tooltip]:before),
	:global([data-tooltip]:after) {
		visibility: hidden;
		opacity: 0;
		pointer-events: none;
		transition: 0.2s ease-out;
		transform: translate(-50%, 5px);
	}

	:global([data-tooltip]:before) {
		position: absolute;
		bottom: 100%;
		left: 50%;
		margin-bottom: 5px;
		padding: 7px;
		width: 100%;
		min-width: 70px;
		max-width: 250px;
		-webkit-border-radius: 3px;
		-moz-border-radius: 3px;
		border-radius: 3px;
		background-color: #000;
		background-color: hsla(0, 0%, 20%, 0.9);
		color: #fff;
		content: attr(data-tooltip);
		text-align: center;
		font-size: 14px;
		line-height: 1.2;
		transition: 0.2s ease-out;
	}

	:global([data-tooltip]:after) {
		position: absolute;
		bottom: 100%;
		left: 50%;
		width: 0;
		border-top: 5px solid #000;
		border-top: 5px solid hsla(0, 0%, 20%, 0.9);
		border-right: 5px solid transparent;
		border-left: 5px solid transparent;
		content: " ";
		font-size: 0;
		line-height: 0;
	}

	:global([data-tooltip]:hover:before),
	:global([data-tooltip]:hover:after) {
		visibility: visible;
		opacity: 1;
		transform: translate(-50%, 0);
	}
	:global([data-tooltip="false"]:hover:before),
	:global([data-tooltip="false"]:hover:after) {
		visibility: hidden;
		opacity: 0;
	}
</style>
