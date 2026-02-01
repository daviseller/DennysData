<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import PlayerPanel from '$lib/components/PlayerPanel.svelte';

	const playerId = $derived(parseInt($page.params.id, 10));

	function handleClose() {
		// Go back in history, or go home if no history
		if (browser && window.history.length > 1) {
			window.history.back();
		} else {
			goto('/');
		}
	}

	function handleGameClick(gameId: number, dateStr: string) {
		// Navigate to home page with date and game as query params
		goto(`/?date=${dateStr}&game=${gameId}`);
	}
</script>

<svelte:head>
	<title>Player Profile | DennysData</title>
</svelte:head>

<div class="player-page">
	<PlayerPanel {playerId} onClose={handleClose} onGameClick={handleGameClick} />
</div>

<style>
	.player-page {
		min-height: 100vh;
		min-height: 100dvh;
	}
</style>
