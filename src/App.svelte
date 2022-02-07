<script lang="ts">
	import { scale } from "svelte/transition";
	import Popup from "./popup.svelte";
	import Settings from "./Settings.svelte";
	import Sidebar from "./sidebar.svelte";
	import { answers, guesses } from "./words";

	/* ---------------------------------- Game ---------------------------------- */
	class Game {
		guesses: string[];
		boxes: ("empty" | "correct" | "semicorrect")[][];
		get coloredBoxes() {
			return this.boxes.map((row) =>
				row.map((color) => {
					switch (color) {
						case "correct":
							return "#AFE1AF";
						case "empty":
							return "#D3D3D3";
						case "semicorrect":
							return "#FFC300";
					}
				})
			);
		}
		word: string;
		started: number;
		endTimer: boolean;
		constructor(
			public wordLength: number,
			public maxGuesses: number,
			public guessesList: string[],
			public answersList: string[]
		) {
			this.guesses = [];
			this.boxes = [...Array(maxGuesses)].map(() =>
				[...Array(wordLength)].map(() => "empty")
			);
			this.word =
				answersList[Math.floor(Math.random() * answersList.length)];
			this.started = Date.now();
			this.endTimer = false;
			console.log(this.word);
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

		game = new Game(wordLength, maxGuesses, guesses, answers);
	});

	function processInput() {
		if (game.validateInput(input) !== true) return;

		/* ---------------------------- Reset / add input --------------------------- */
		inputField.value = "";
		game.guesses = [...game.guesses, input];

		/* -------------------------- Determine the colors -------------------------- */
		for (let i = 0; i < input.length; i++) {
			const letter = input[i];
			const index = game.word.indexOf(letter);

			if (index === -1) {
				game.boxes[game.guesses.length - 1][i] = "empty";
				continue;
			}

			if (game.word[i] === letter) {
				game.boxes[game.guesses.length - 1][i] = "correct";
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
				continue;
			}

			game.boxes[game.guesses.length - 1][i] = "semicorrect";
		}

		/* ------------------------------- Win / lose ------------------------------- */
		if (input === game.word) {
			won = true;
			game.endTimer = true;
		} else if (game.guesses.length >= game.maxGuesses) {
			lose = true;
			game.endTimer = true;
		}
	}

	/* --------------------------------- Inputs --------------------------------- */
	let _input: string;
	let input: string;
	$: input = _input?.toLocaleLowerCase();
	let inputField: HTMLInputElement;
	let inputValid: true | string = "Input too short!";
	$: inputValid = !won
		? !lose
			? game.validateInput(input)
			: "You lost!"
		: "You won!";
	function onKeyPress(event: KeyboardEvent) {
		if (event.code === "Enter") processInput();
	}

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

	/* -------------------------------- Settings -------------------------------- */
	let settingsOpen = false;

	/* -------------------------------- Game div -------------------------------- */
	let gameDiv /*: HTMLDivElement*/;
	function zoomIn() {
		const style: any = getComputedStyle(gameDiv);
		gameDiv.style.zoom = parseFloat(style.zoom) + 0.1;
	}
	function zoomOut() {
		const style: any = getComputedStyle(gameDiv);
		gameDiv.style.zoom = parseFloat(style.zoom) - 0.1;
	}
</script>

<main>
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
								class="box"
								style="--color: {_row[column]}"
								transition:scale
							>
								{game.guesses[row][column].toUpperCase()}
							</div>
						{/key}
					{:else}
						<div class="box" style="--color: {_row[column]}" />
					{/if}
				{/each}
			{/each}
		</div>

		<!-- Input -->
		<div class="input">
			<input
				class="inputChildren"
				bind:value={_input}
				bind:this={inputField}
				on:keypress={onKeyPress}
				maxlength={game.wordLength}
			/>
			{#if inputValid === true}
				<button on:click={processInput}>Enter</button>
			{:else}
				<button disabled data-tooltip={inputValid}>Enter</button>
			{/if}
		</div>
	{/if}

	<!-- Win / lose popups -->
	{#if won && !closedWonPopup}
		<Popup
			message="🎉 You won {game.guesses.length === 1
				? 'first try! (hacker)'
				: `in ${game.guesses.length} tries!`}"
			onClose={closeWonPopup}
		/>
	{/if}

	{#if lose && !closedLosePopup}
		<Popup
			message="🎈 You lost, the word was {game.word}!"
			onClose={closeLosePopup}
		/>
	{/if}

	<!-- Darkmode -->
	<!-- svelte-ignore missing-declaration -->
	<Sidebar
		{game}
		toggleSettings={() => (settingsOpen = !settingsOpen)}
		{zoomIn}
		{zoomOut}
	/>

	<!-- Settings -->
	{#if settingsOpen}
		<Settings />
	{/if}
</main>

<style>
	.input {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 15px;
	}

	.inputChildren {
		margin: 10px;
		margin-top: 0px;
	}

	.game {
		display: grid;
		zoom: 50%;

		grid-template-columns: repeat(var(--word-length), 100px);
		grid-template-rows: repeat(var(--max-guesses), 100px);
		grid-gap: 10px;

		justify-content: center;
		align-content: center;
	}

	.box {
		background-color: var(--color);
		border-radius: 5px;

		font-size: 300%;
		color: white;

		display: flex;
		justify-content: center;
		align-items: center;
	}

	/* ------------------------------- Background ------------------------------- */
	:global(body) {
		background-color: #fff;
		transition: background-color 0.3s;
	}

	:global(body.dark-mode) {
		background-color: #424549;
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
