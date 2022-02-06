<script lang="ts">
	import { answers, guesses } from "./words";

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
		constructor(public wordLength: number, public maxGuesses: number) {
			this.guesses = [];
			this.boxes = [...Array(maxGuesses)].map(() =>
				[...Array(wordLength)].map(() => "empty")
			);
			this.word = answers[Math.floor(Math.random() * answers.length)];
		}

		reset() {
			this.guesses = [];
		}

		validateInput(input: string) {
			if (!input) return "Enter something!";
			if (input?.length < this.wordLength) return "Input too short!";
			if (input?.length > this.wordLength) return "Input too long!";
			if (!guesses.includes(input))
				return `"${input}" is not a valid word!`;
			return true;
		}
	}

	const game = new Game(5, 6);

	let input: string;
	let inputValid: true | string = "Input too short!";
	$: inputValid = game.validateInput(input);
</script>

<main>
	<div
		class="game"
		style="--max-guesses: {game.maxGuesses}; --word-length: {game.wordLength}"
	>
		{#each game.coloredBoxes as _row, row}
			{#each _row as _, column}
				<div
					class="box"
					style="--color: {_row[column]}"
					id="{row},{column}"
				>
					{row}, {column}
				</div>
			{/each}
		{/each}
	</div>

	<div class="input">
		<input
			class="inputChildren"
			bind:value={input}
			maxlength={game.wordLength}
		/>
		{#if inputValid === true}
			<button>Enter</button>
		{:else}
			<button disabled data-tooltip={inputValid}>Enter</button>
		{/if}
	</div>
</main>

<style>
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

	.input {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 5px;
	}

	.inputChildren {
		margin: 10px;
		margin-top: 0px;
	}

	.game {
		display: grid;

		grid-template-columns: repeat(var(--word-length), 100px);
		grid-template-rows: repeat(var(--max-guesses), 100px);
		grid-gap: 10px;

		justify-content: center;
		align-content: center;
	}

	.box {
		background-color: var(--color);
		border-radius: 5px;

		font-size: 150%;
		color: white;

		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
