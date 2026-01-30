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

</script>

<div class="day-picker" role="group" aria-label="Date navigation">
	<button
		class="nav-btn"
		onclick={goToPreviousDay}
		aria-label="Previous day"
	>
		<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
			<path d="M10.5 12.5L5.5 8L10.5 3.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="square"/>
		</svg>
	</button>

	<span class="date-display">
		{formatDisplayDate(selectedDate)}
	</span>

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

	.date-display {
		min-width: 180px;
		font-family: var(--font-stats);
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0.05em;
		color: var(--text-primary);
		text-align: center;
	}
</style>
