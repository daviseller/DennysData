<script lang="ts">
	import PlayerPanel from './PlayerPanel.svelte';

	interface Props {
		playerId: number | null;
		onClose: () => void;
	}

	let { playerId, onClose }: Props = $props();

	const isOpen = $derived(playerId !== null);

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && playerId}
	<div
		class="slide-panel-backdrop"
		class:open={isOpen}
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Enter' && onClose()}
		role="dialog"
		aria-modal="true"
		aria-label="Player profile"
		tabindex="-1"
	>
		<aside class="slide-panel" class:open={isOpen}>
			<PlayerPanel {playerId} {onClose} />
		</aside>
	</div>
{/if}

<style>
	.slide-panel-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 100;
		opacity: 0;
		pointer-events: none;
		transition: opacity var(--transition-base);
	}

	.slide-panel-backdrop.open {
		opacity: 1;
		pointer-events: auto;
	}

	.slide-panel {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		width: 680px;
		max-width: 100vw;
		background: var(--bg-app);
		border-left: 1px solid var(--border-primary);
		transform: translateX(100%);
		transition: transform var(--transition-base);
		overflow: hidden;
	}

	.slide-panel.open {
		transform: translateX(0);
	}

	@media (max-width: 768px) {
		/* On mobile, use full width - though typically we'd navigate to the route instead */
		.slide-panel {
			width: 100vw;
		}
	}
</style>
