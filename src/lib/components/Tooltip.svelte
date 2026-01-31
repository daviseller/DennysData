<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		content: string;
		position?: 'top' | 'bottom' | 'left' | 'right';
		delay?: number;
		children: import('svelte').Snippet;
	}

	let { content, position = 'top', delay = 200, children }: Props = $props();

	let tooltipEl: HTMLElement | null = $state(null);
	let triggerEl: HTMLElement | null = $state(null);
	let visible = $state(false);
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let coords = $state({ x: 0, y: 0 });

	function show() {
		if (timeoutId) clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			updatePosition();
			visible = true;
		}, delay);
	}

	function hide() {
		if (timeoutId) clearTimeout(timeoutId);
		visible = false;
	}

	function updatePosition() {
		if (!triggerEl) return;

		const rect = triggerEl.getBoundingClientRect();
		const scrollX = window.scrollX;
		const scrollY = window.scrollY;

		switch (position) {
			case 'top':
				coords = {
					x: rect.left + scrollX + rect.width / 2,
					y: rect.top + scrollY
				};
				break;
			case 'bottom':
				coords = {
					x: rect.left + scrollX + rect.width / 2,
					y: rect.bottom + scrollY
				};
				break;
			case 'left':
				coords = {
					x: rect.left + scrollX,
					y: rect.top + scrollY + rect.height / 2
				};
				break;
			case 'right':
				coords = {
					x: rect.right + scrollX,
					y: rect.top + scrollY + rect.height / 2
				};
				break;
		}
	}

	onMount(() => {
		return () => {
			if (timeoutId) clearTimeout(timeoutId);
		};
	});
</script>

<span
	class="tooltip-trigger"
	bind:this={triggerEl}
	onmouseenter={show}
	onmouseleave={hide}
	onfocus={show}
	onblur={hide}
	role="button"
	tabindex="0"
>
	{@render children()}
</span>

{#if visible && content}
	<div
		class="tooltip tooltip-{position}"
		bind:this={tooltipEl}
		style="--tooltip-x: {coords.x}px; --tooltip-y: {coords.y}px;"
		role="tooltip"
	>
		<div class="tooltip-content">
			{content}
		</div>
		<div class="tooltip-arrow"></div>
	</div>
{/if}

<style>
	.tooltip-trigger {
		display: inline-flex;
		align-items: center;
		cursor: inherit;
	}

	.tooltip {
		position: fixed;
		z-index: 9999;
		pointer-events: none;
		animation: tooltip-fade-in 150ms ease-out;
	}

	@keyframes tooltip-fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.tooltip-content {
		background: var(--bg-card);
		color: var(--text-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		padding: var(--space-sm) var(--space-md);
		font-family: var(--font-display);
		font-size: 12px;
		line-height: 1.5;
		max-width: 280px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		white-space: pre-line;
		word-wrap: break-word;
	}

	.tooltip-arrow {
		position: absolute;
		width: 8px;
		height: 8px;
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		transform: rotate(45deg);
	}

	/* Position: Top */
	.tooltip-top {
		left: var(--tooltip-x);
		top: var(--tooltip-y);
		transform: translate(-50%, calc(-100% - 8px));
	}

	.tooltip-top .tooltip-arrow {
		bottom: -5px;
		left: 50%;
		transform: translateX(-50%) rotate(45deg);
		border-top: none;
		border-left: none;
	}

	/* Position: Bottom */
	.tooltip-bottom {
		left: var(--tooltip-x);
		top: var(--tooltip-y);
		transform: translate(-50%, 8px);
	}

	.tooltip-bottom .tooltip-arrow {
		top: -5px;
		left: 50%;
		transform: translateX(-50%) rotate(45deg);
		border-bottom: none;
		border-right: none;
	}

	/* Position: Left */
	.tooltip-left {
		left: var(--tooltip-x);
		top: var(--tooltip-y);
		transform: translate(calc(-100% - 8px), -50%);
	}

	.tooltip-left .tooltip-arrow {
		right: -5px;
		top: 50%;
		transform: translateY(-50%) rotate(45deg);
		border-left: none;
		border-bottom: none;
	}

	/* Position: Right */
	.tooltip-right {
		left: var(--tooltip-x);
		top: var(--tooltip-y);
		transform: translate(8px, -50%);
	}

	.tooltip-right .tooltip-arrow {
		left: -5px;
		top: 50%;
		transform: translateY(-50%) rotate(45deg);
		border-right: none;
		border-top: none;
	}
</style>
