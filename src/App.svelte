<script lang="ts">
	import { scale } from "svelte/transition";
	import Bar from "./componenets/bar.svelte";
	import InstantPopup from "./componenets/instantpopup.svelte";
	import Keyboard from "./componenets/keyboard.svelte";
	import Popup from "./componenets/popup.svelte";
	import Settings from "./componenets/settings.svelte";
	import { alphabet, unobscureWord } from "./ts/alphabet";
	import { Game, gameWritable } from "./ts/game";
	import { instantPopupsWritable } from "./ts/instantpopups";
	import { copyGame, copyLink } from "./ts/sharing";
	import { stats, updateStats } from "./ts/stats";

	let customOpen = false;

	let wordLength = 5;
	let maxGuesses = 6;

	const searchParams = new URLSearchParams(window.location.search);
	if (searchParams.has("wordLength") && !isNaN(<any>searchParams.get("wordLength")) && parseInt(searchParams.get("wordLength")) >= 3 && parseInt(searchParams.get("wordLength")) <= 7) {
		const _wordLength = parseInt(searchParams.get("wordLength"));
		wordLength = _wordLength;
	}

	if (searchParams.has("maxGuesses") && !isNaN(<any>searchParams.get("maxGuesses")) && parseInt(searchParams.get("maxGuesses")) >= 3 && parseInt(searchParams.get("maxGuesses")) <= 9) {
		const _maxGuesses = parseInt(searchParams.get("maxGuesses"));
		maxGuesses = _maxGuesses;
	}

	let customWord: false | string = false;
	if (searchParams.has("word")) {
		customWord = unobscureWord(searchParams.get("word"));
		if (customWord.length !== wordLength) customWord = false;
	}

	const now = new Date();
	const days = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000) - 1;

	const start = async () => {
		let _guesses: string[];
		let _answers: string[];

		const _words = await fetch(`./words/word_${wordLength}.txt`);
		const words = await _words.text();
		_guesses = words.split(",");
		if (wordLength !== 5) {
			_answers = words.split(",");
		}

		if (wordLength === 5) {
			const _words = await fetch(`./words/word_${wordLength}_answers.txt`);
			const words = await _words.text();
			_answers = words.split(",");
		}

		let _daily: string;
		if (searchParams.get("word") === "daily") {
			if (localStorage.getItem(`daily,${wordLength}`) !== days.toString()) {
				const _dailyList = await fetch(`./words/daily_${wordLength}.txt`);
				const dailyList = await _dailyList.text();
				_daily = dailyList
					.split(",")
					.filter((daily) => daily.split("|")[0] === days.toString())[0]
					.split("|")[1];
				maxGuesses = 6;
			} else {
				$instantPopupsWritable.add("You already did the daily word for today!, using random word instead.");
			}
		}

		return [_guesses, _answers, _daily];
	};

	const guessesAnswers = start();
	guessesAnswers.then((guessesAnswers) => {
		const guesses = <string[]>guessesAnswers[0];
		const answers = <string[]>guessesAnswers[1];
		const daily = <string>guessesAnswers[2];

		if (daily) {
			$gameWritable = new Game(wordLength, maxGuesses, guesses, answers, daily, true);
			gameWritable.update((n) => n);
		} else {
			$gameWritable = new Game(wordLength, maxGuesses, guesses, answers, customWord);
			gameWritable.update((n) => n);
		}
	});

	const processInput = () => {
		if ($gameWritable.validateInput(input) !== true) return;

		/* ---------------------------- Reset / add input --------------------------- */
		$gameWritable.guesses = [...$gameWritable.guesses, input];
		gameWritable.update((n) => n);

		/* -------------------------- Determine the colors -------------------------- */

		/**
		 * Array of already colored indexes in the word
		 */
		const foundindexes = [];
		/* ------------------------- Loop through the input ------------------------- */
		for (let i = 0; i < input.length; i++) {
			const letter = input[i];
			const index = $gameWritable.word.indexOf(letter);

			console.log(`Starting index i=${i} letter=${letter} index(of letter in word)=${index}`);

			/* --------------- If the input letter isnt found in the word --------------- */
			if (index === -1) {
				$gameWritable.boxes[$gameWritable.guesses.length - 1][i] = "empty";
				if ($gameWritable.keyboardColors[letter] !== "correct" && $gameWritable.keyboardColors[letter] !== "semicorrect") {
					$gameWritable.keyboardColors[letter] = "empty";
				}
				console.log(" - Index not found at all (empty)");
				// gameWritable.update((n) => n);
				continue;
			}

			/* -------- If the input letter is in the word and in the right index ------- */
			if ($gameWritable.word[i] === letter) {
				$gameWritable.boxes[$gameWritable.guesses.length - 1][i] = "correct";
				$gameWritable.keyboardColors[letter] = "correct";
				foundindexes.push(index);
				// gameWritable.update((n) => n);
				console.log(" - Index is in the right place (correct)");
				continue;
			}

			/* ---------------- Check to see if a correct index would be ---------------- */
			/* ------------------- found if the loop were to continue ------------------- */
			let found = false;
			for (let x = 0; x < input.length; x++) {
				if ($gameWritable.word[i] === input[x] && x === i) {
					found = true;
					break;
				}
			}

			console.log(` - found=${found}`);

			if (found) {
				$gameWritable.boxes[$gameWritable.guesses.length - 1][i] = "empty";
				if ($gameWritable.keyboardColors[letter] !== "correct" && $gameWritable.keyboardColors[letter] !== "semicorrect") {
					$gameWritable.keyboardColors[letter] = "empty";
				}
				// gameWritable.update((n) => n);
				console.log(" - Set empty due to found=true");
				continue;
			}

			if (!foundindexes.includes(index)) {
				$gameWritable.boxes[$gameWritable.guesses.length - 1][i] = "semicorrect";
				if ($gameWritable.keyboardColors[letter] !== "correct") {
					$gameWritable.keyboardColors[letter] = "semicorrect";
				}
				foundindexes.push(index);
				console.log(" - Foundindex doesnt include (semicorrect)");
				// gameWritable.update((n) => n);
				continue;
			}

			$gameWritable.boxes[$gameWritable.guesses.length - 1][i] = "empty";
			if ($gameWritable.keyboardColors[letter] !== "correct" && $gameWritable.keyboardColors[letter] !== "semicorrect") {
				$gameWritable.keyboardColors[letter] = "empty";
			}
			// gameWritable.update((n) => n);
		}

		/* ------------------------------- Win / lose ------------------------------- */
		if (input === $gameWritable.word) {
			won = true;
			$gameWritable.endTimer = Date.now();
			// gameWritable.update((n) => n);
			updateStats({ ...$stats, wins: $stats.wins + 1 });
			updateStats({ ...$stats, currentStreak: $stats.currentStreak + 1 });
			if ($stats.currentStreak > $stats.maxStreak) {
				updateStats({ ...$stats, maxStreak: $stats.currentStreak });
			}
			updateStats({ ...$stats, played: $stats.played + 1 });
			localStorage.setItem(`daily,${wordLength}`, days.toString());
		} else if ($gameWritable.guesses.length >= $gameWritable.maxGuesses) {
			lose = true;
			$gameWritable.endTimer = Date.now();
			// gameWritable.update((n) => n);
			updateStats({ ...$stats, losses: $stats.losses + 1 });
			updateStats({ ...$stats, played: $stats.played + 1 });
			updateStats({ ...$stats, currentStreak: 0 });
		}

		gameWritable.update((n) => n);

		input = "";
	};

	/* --------------------------------- Inputs --------------------------------- */
	let input = "";
	const inputValid = () => {
		return !won ? (!lose ? $gameWritable.validateInput(input) : `You lost, the word was ${$gameWritable.word}!`) : "You won!";
	};

	const keyboardPress = (key: string) => {
		if (key === "backspace") {
			input = input.slice(0, -1);
		} else if (key == "enter") {
			if (inputValid() !== true) $instantPopupsWritable.add(inputValid().toString());
			processInput();
		} else if (input.length <= $gameWritable.wordLength - 1) {
			input = `${input}${key}`;
		}
	};

	document.addEventListener("keydown", (event) => {
		if (customOpen) return;

		if (event.code === "Escape") settingsOpen = !settingsOpen;
		else if (event.code === "Backspace") {
			input = input.slice(0, -1);
		} else if (event.code === "Enter") {
			if (inputValid() !== true) $instantPopupsWritable.add(inputValid().toString());
			processInput();
		} else if (alphabet.includes(event.key.toLowerCase()) && input.length <= $gameWritable.wordLength - 1) {
			input = `${input}${event.key.toLowerCase()}`;
		}
	});

	/* --------------------------------- Popups --------------------------------- */
	let won = false;
	let closedWonPopup = false;

	let lose = false;
	let closedLosePopup = false;

	/* -------------------------------- Settings -------------------------------- */
	let settingsOpen = false;

	/* ---------------------------------- Zoom ---------------------------------- */
	let gameDiv: HTMLDivElement;
	let resized = false;
	$: if (!resized && barDiv?.style && keyboardDiv?.style) onResize();

	const onResize = () => {
		const barRect = barDiv.getBoundingClientRect();
		const keyboardRect = keyboardDiv.getBoundingClientRect();

		const distance = Math.abs(barRect.bottom + 25 - keyboardRect.top + 50);
		const value = distance / $gameWritable.maxGuesses - 5;

		gameDiv.style.gridTemplateRows = `repeat(var(--max-guesses), ${value}px`;
		gameDiv.style.gridTemplateColumns = `repeat(var(--word-length), ${value * $gameWritable.wordLength < window.innerWidth ? `${value}px` : "1fr"}`;
	};

	window.addEventListener("resize", onResize);
	setTimeout(onResize, 1000);

	let keyboardDiv: HTMLDivElement;
	let barDiv: HTMLDivElement;
</script>

<main>
	<Bar bind:showWordMenu={customOpen} bind:barDiv {copyLink} {copyGame} toggleSettings={() => (settingsOpen = !settingsOpen)} />

	{#if $gameWritable.wordLength !== 0}
		<!-- Game -->
		<div class="game" style="--max-guesses: {$gameWritable.maxGuesses}; --word-length: {$gameWritable.wordLength}" bind:this={gameDiv}>
			{#each $gameWritable.coloredBoxes as _row, row}
				{#each _row as _, column}
					{#if $gameWritable.guesses[row]}
						{#key $gameWritable.guesses[row].charAt(column).toUpperCase()}
							<div class="box noBorder" style="--color: {_row[column]}" transition:scale={{ delay: 200 * column }}>
								{$gameWritable.guesses[row][column].toUpperCase()}
							</div>
						{/key}
					{:else}
						<div class="box">
							{input?.[column] && $gameWritable.guesses.length === row ? input?.[column]?.toUpperCase() : ""}
						</div>
					{/if}
				{/each}
			{/each}
		</div>

		<!-- Input -->
		<div class="input"><Keyboard {keyboardPress} bind:keyboardDiv /></div>
	{/if}

	<!-- Settings -->
	{#if settingsOpen}
		<Settings closeSettings={() => (settingsOpen = false)} />
	{/if}

	{#key $instantPopupsWritable.update}
		<div class="instantPopups">
			{#each Object.keys($instantPopupsWritable.popups) as key}
				<InstantPopup message={$instantPopupsWritable.popups[key].message} duration={$instantPopupsWritable.popups[key].delay} destroy={() => $instantPopupsWritable.remove(key)} />
			{/each}
		</div>
	{/key}

	<!-- Win / lose popups -->
	{#if won && !closedWonPopup}
		<Popup onClose={() => (closedWonPopup = true)}>
			<button on:click={copyLink}>🔗 Share word (link for others to try your word)</button>
			<button on:click={copyGame}>🔗 Share game (sharing your guesses, word, and time)</button>
			<h1>
				🎉 You {$gameWritable.dailyWord ? "beat the daily word" : "won"}
				{$gameWritable.guesses.length === 1 ? "first try! (Cheater 👀)" : `in ${$gameWritable.guesses.length} tries!`}
			</h1>
		</Popup>
	{/if}

	{#if lose && !closedLosePopup}
		<Popup onClose={() => (closedLosePopup = true)}>
			<button on:click={copyLink}>🔗 Share word (link for others to try your word)</button>
			<button on:click={copyGame}>🔗 Share game (sharing your guesses, word, and time)</button>
			<h1>🎈 You lost{$gameWritable.dailyWord ? ", click the reload icon on the top right to try the daily word again" : `, the word was ${$gameWritable.word}`}!</h1>
		</Popup>
	{/if}

	<svg class="githubIco" width="24" height="24" viewBox="0 0 24 24" fill-opacity="0.6" on:click={() => window.open("https://github.com/jameslinimk/wordlecloneweb", "_blank")}
		><path
			d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
		/></svg
	>
</main>

<style>
	.instantPopups {
		position: fixed;
		top: 10%;
		left: 50%;
		transform: translate(-50%, 0);

		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.githubIco {
		position: absolute;
		bottom: 10px;
		right: 10px;
		background-color: rgb(216, 216, 216);
		padding: 2px;
		border-radius: 5px;
		opacity: 0.6;
		transition: 0.3s;
	}

	:global(body.darkMode) .githubIco {
		background-color: whitesmoke;
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

		justify-content: center;
		align-content: center;
	}

	.box {
		background-color: var(--color);
		border-radius: 2px;
		border-style: solid;
		border-color: grey;
		border-width: 2px;

		font-size: 300%;
		color: grey;

		display: flex;
		justify-content: center;
		align-items: center;
	}

	@media only screen and (max-height: 800px) {
		.box {
			font-size: 150%;
		}
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
</style>
