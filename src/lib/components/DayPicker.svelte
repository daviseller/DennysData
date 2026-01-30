<script lang="ts">
	import { formatDateForApi } from '$lib/api';

	interface Props {
		selectedDate: Date;
		onDateChange: (date: Date) => void;
	}

	let { selectedDate, onDateChange }: Props = $props();

	function formatDisplayDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).toUpperCase();
	}

	function goToPreviousDay() {
		const prev = new Date(selectedDate);
		prev.setDate(prev.getDate() - 1);
		onDateChange(prev);
	}

	function goToNextDay() {
		const next = new Date(selectedDate);
		next.setDate(next.getDate() + 1);
		onDateChange(next);
	}

	function goToToday() {
		onDateChange(new Date());
	}

	function handleKeydown(e: KeyboardEvent) {
		switch (e.key) {
			case 'ArrowLeft':
				e.preventDefault();
				goToPreviousDay();
				break;
			case 'ArrowRight':
				e.preventDefault();
				goToNextDay();
				break;
			case 't':
			case 'T':
				if (!e.ctrlKey && !e.metaKey && !e.altKey) {
					e.preventDefault();
					goToToday();
				}
				break;
		}
	}

	const isToday = $derived.by(() => {
		const today = new Date();
		return (
			selectedDate.getDate() === today.getDate() &&
			selectedDate.getMonth() === today.getMonth() &&
			selectedDate.getFullYear() === today.getFullYear()
		);
	});
</script>

<div class="day-picker" role="toolbar" aria-label="Date navigation" tabindex="-1" onkeydown={handleKeydown}>
	<button
		class="nav-btn"
		onclick={goToPreviousDay}
		aria-label="Previous day"
	>
		<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
			<path d="M10.5 12.5L5.5 8L10.5 3.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="square"/>
		</svg>
	</button>

	<div class="date-container">
		<span class="date-display">
			{formatDisplayDate(selectedDate)}
		</span>
		{#if !isToday}
			<button class="today-btn" onclick={goToToday}>
				TODAY
			</button>
		{/if}
	</div>

	<button
		class="nav-btn"
		onclick={goToNextDay}
		aria-label="Next day"
	>
		<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
			<path d="M5.5 3.5L10.5 8L5.5 12.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="square"/>
		</svg>
	</button>
</div>

<style>
	.day-picker {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
	}

	.nav-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		background: var(--bg-inset);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		cursor: pointer;
		transition: border-color var(--transition-fast), color var(--transition-fast);
	}

	.nav-btn:hover {
		border-color: var(--accent-primary);
		color: var(--text-primary);
	}

	.nav-btn:active {
		background: var(--bg-card-hover);
	}

	.nav-btn:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: 2px;
	}

	.date-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xs);
		min-width: 180px;
	}

	.date-display {
		font-family: var(--font-stats);
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0.05em;
		color: var(--text-primary);
		text-align: center;
	}

	.today-btn {
		padding: 2px var(--space-sm);
		font-family: var(--font-stats);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.03em;
		color: var(--accent-primary);
		background: transparent;
		border: 1px solid var(--accent-primary);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: background var(--transition-fast), color var(--transition-fast);
	}

	.today-btn:hover {
		background: var(--accent-primary);
		color: white;
	}

	.today-btn:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: 2px;
	}
</style>
