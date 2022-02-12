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
	}

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

	function processInput() {
		if ($gameWritable.validateInput(input) !== true) return;

		/* ---------------------------- Reset / add input --------------------------- */
		$gameWritable.guesses = [...$gameWritable.guesses, input];
		gameWritable.update((n) => n);

		/* -------------------------- Determine the colors -------------------------- */
		const foundindexes = [];
		for (let i = 0; i < input.length; i++) {
			const letter = input[i];
			const index = $gameWritable.word.indexOf(letter);

			if (index === -1) {
				$gameWritable.boxes[$gameWritable.guesses.length - 1][i] = "empty";
				if ($gameWritable.keyboardColors[letter] !== "correct" && $gameWritable.keyboardColors[letter] !== "semicorrect") {
					$gameWritable.keyboardColors[letter] = "empty";
				}
				// gameWritable.update((n) => n);
				continue;
			}

			if ($gameWritable.word[i] === letter) {
				$gameWritable.boxes[$gameWritable.guesses.length - 1][i] = "correct";
				$gameWritable.keyboardColors[letter] = "correct";
				foundindexes.push(index);
				// gameWritable.update((n) => n);
				continue;
			}

			let found = false;
			for (let x = 0; x < input.length; x++) {
				if ($gameWritable.word[i] === input[x] && x === i) {
					found = true;
					break;
				}
			}

			if (found) {
				$gameWritable.boxes[$gameWritable.guesses.length - 1][i] = "empty";
				if ($gameWritable.keyboardColors[letter] !== "correct" && $gameWritable.keyboardColors[letter] !== "semicorrect") {
					$gameWritable.keyboardColors[letter] = "empty";
				}
				// gameWritable.update((n) => n);
				continue;
			}

			if (!foundindexes.includes(index)) {
				$gameWritable.boxes[$gameWritable.guesses.length - 1][i] = "semicorrect";
				if ($gameWritable.keyboardColors[letter] !== "correct") {
					$gameWritable.keyboardColors[letter] = "semicorrect";
				}
				foundindexes.push(index);
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
			changeStats({ ...stats, wins: stats.wins + 1 });
			changeStats({ ...stats, currentStreak: stats.currentStreak + 1 });
			if (stats.currentStreak > stats.maxStreak) {
				changeStats({ ...stats, maxStreak: stats.currentStreak });
			}
			changeStats({ ...stats, played: stats.played + 1 });
			localStorage.setItem(`daily,${wordLength}`, days.toString());
		} else if ($gameWritable.guesses.length >= $gameWritable.maxGuesses) {
			lose = true;
			$gameWritable.endTimer = Date.now();
			// gameWritable.update((n) => n);
			changeStats({ ...stats, losses: stats.losses + 1 });
			changeStats({ ...stats, played: stats.played + 1 });
			changeStats({ ...stats, currentStreak: 0 });
		}

		gameWritable.update((n) => n);

		input = "";
	}

	/* --------------------------------- Inputs --------------------------------- */
	let input = "";
	function inputValid() {
		return !won ? (!lose ? $gameWritable.validateInput(input) : `You lost, the word was ${$gameWritable.word}!`) : "You won!";
	}

	function keyboardPress(key: string) {
		if (key === "backspace") {
			input = input.slice(0, -1);
		} else if (key == "Enter") {
			if (inputValid() !== true) $instantPopupsWritable.add(inputValid().toString());
			processInput();
		} else if (input.length <= $gameWritable.wordLength - 1) {
			input = `${input}${key}`;
		}
	}

	document.onkeydown = (event) => {
		if (event.code === "Escape") settingsOpen = !settingsOpen;
		else if (event.code === "Equal") zoomIn();
		else if (event.code === "Minus") zoomOut();
		else if (event.code === "Backspace") {
			input = input.slice(0, -1);
		} else if (event.code === "Enter") {
			if (inputValid() !== true) $instantPopupsWritable.add(inputValid().toString());
			processInput();
		} else if (alphabet.includes(event.key.toLowerCase()) && input.length <= $gameWritable.wordLength - 1) {
			input = `${input}${event.key.toLowerCase()}`;
		}
	};

	/* --------------------------------- Popups --------------------------------- */
	let won = false;
	let closedWonPopup = false;

	let lose = false;
	let closedLosePopup = false;

	/* -------------------------------- Settings -------------------------------- */
	let settingsOpen = false;

	/* ---------------------------------- Zoom ---------------------------------- */
	let gameDiv /*: HTMLDivElement*/; // Because for some reason style.zoom isnt a thing
	let zoomed = false;
	$: {
		if (gameDiv?.style && !zoomed) {
			const localZoom = localStorage.getItem("zoom");
			if (localZoom && !isNaN(<any>localZoom)) {
				gameDiv.style.zoom = parseFloat(localZoom);
			}
			zoomed = true;
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

	/* ---------------------------------- Stats --------------------------------- */
	interface Stats {
		played: number;
		wins: number;
		losses: number;
		currentStreak: number;
		maxStreak: number;
	}
	const statsKeys = ["played", "wins", "losses", "currentStreak", "maxStreak"];
	let stats: Stats = {
		played: 0,
		wins: 0,
		losses: 0,
		currentStreak: 0,
		maxStreak: 0,
	};
	const localStats = localStorage.getItem("stats");
	if (localStats) {
		let parsedStats: Stats;
		try {
			parsedStats = JSON.parse(localStats);
		} catch {
			parsedStats = null;
		}
		if (parsedStats) {
			const keys = Object.keys(parsedStats);
			if (keys.sort().join(",") === statsKeys.sort().join(",")) {
				keys.forEach((key) => {
					if (typeof parsedStats[key] !== "number") {
						parsedStats[key] = 0;
					}
				});
			}
			stats = parsedStats;
		}

		localStorage.setItem("stats", JSON.stringify(stats));
	} else {
		localStorage.setItem("stats", JSON.stringify(stats));
	}

	function changeStats(newStats: Stats) {
		stats = newStats;
		localStorage.setItem("stats", JSON.stringify(stats));
	}
</script>

<main>
	<Bar {zoomIn} {zoomOut} {copyLink} {copyGame} getStats={() => stats} toggleSettings={() => (settingsOpen = !settingsOpen)} />

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
		<div class="input"><Keyboard {keyboardPress} /></div>
	{/if}

	<!-- Settings -->
	{#if settingsOpen}
		<Settings closeSettings={() => (settingsOpen = false)} />
	{/if}

	{#key $instantPopupsWritable.update}
		{#each Object.keys($instantPopupsWritable.popups) as key}
			<InstantPopup message={$instantPopupsWritable.popups[key].message} duration={$instantPopupsWritable.popups[key].delay} destroy={() => $instantPopupsWritable.remove(key)} />
		{/each}
	{/key}

	<!-- Win / lose popups -->
	{#if won && !closedWonPopup}
		<Popup
			onClose={() => (closedWonPopup = true)}
			customButtons={[
				{
					message: "Share your word",
					onClick: copyLink,
				},
				{
					message: "Share this game",
					onClick: copyGame,
				},
			]}
		>
			<h1>
				🎉 You {$gameWritable.dailyWord ? "beat the daily word" : "won"}
				{$gameWritable.guesses.length === 1 ? "first try! (cheater)" : `in ${$gameWritable.guesses.length} tries!`}
			</h1>
		</Popup>
	{/if}

	{#if lose && !closedLosePopup}
		<Popup
			onClose={() => (closedLosePopup = true)}
			customButtons={[
				{
					message: "Share your word",
					onClick: copyLink,
				},
				{
					message: "Share this game",
					onClick: copyGame,
				},
			]}
		>
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
