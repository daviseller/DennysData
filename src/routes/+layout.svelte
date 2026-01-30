<script lang="ts">
	import '$lib/styles/tokens.css';
	import '$lib/styles/base.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>DennysData - NBA Box Scores</title>
</svelte:head>

{@render children()}
