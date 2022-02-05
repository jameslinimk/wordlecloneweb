<script lang="ts">
	class Game {
		guesses: string[];
		boxes: string[][];
		constructor(public wordLength: number, public maxGuesses: number) {
			this.guesses = [];
			this.boxes = Array(maxGuesses).fill(
				Array(wordLength).fill("#D3D3D3")
			);
		}

		reset() {
			this.guesses = [];
		}
	}

	const game = new Game(5, 6);

	function setColor() {
		console.log("Before", game.boxes);
		game.boxes[0][2] = "#FF0000";
		game.boxes[4][3] = "#FF0000";
		console.log(game.boxes);
	}
</script>

<main>
	<div
		class="game"
		style="--max-guesses: {game.maxGuesses}; --word-length: {game.wordLength}"
	>
		{#each game.boxes as _row, row}
			{#each _row as _, column}
				<div
					class="box"
					style="--color: {_row[column]}"
					id="{row},{column}"
				>
					{row}, {column}, {_row[column]}
				</div>
			{/each}
		{/each}
	</div>

	<button on:click={setColor}>Click</button>
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
		color: #fff;
		border-radius: 5px;
		padding: 20px;
		font-size: 150%;
	}
</style>
