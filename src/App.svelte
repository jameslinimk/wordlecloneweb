<script lang="ts">
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
		constructor(public wordLength: number, public maxGuesses: number) {
			this.guesses = [];
			this.boxes = [...Array(maxGuesses)].map(() =>
				[...Array(wordLength)].map(() => "empty")
			);
		}

		reset() {
			this.guesses = [];
		}
	}

	const game = new Game(5, 6);
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

	<input />
</main>

<style>
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
