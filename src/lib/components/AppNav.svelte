<script lang="ts">
	import { page } from '$app/stores';

	interface NavItem {
		href: string;
		label: string;
	}

	const navItems: NavItem[] = [
		{ href: '/', label: 'Box Scores' },
		{ href: '/stats', label: 'Stats' }
	];

	function isActive(href: string, currentPath: string): boolean {
		if (href === '/') {
			// Home is active only on exact match or with query params
			return currentPath === '/' || currentPath.startsWith('/?');
		}
		return currentPath.startsWith(href);
	}
</script>

<nav class="app-nav" aria-label="Main navigation">
	{#each navItems as item, i (item.href)}
		{#if i > 0}
			<span class="nav-divider">·</span>
		{/if}
		<a
			href={item.href}
			class="nav-link"
			class:active={isActive(item.href, $page.url.pathname)}
			aria-current={isActive(item.href, $page.url.pathname) ? 'page' : undefined}
		>
			{item.label}
		</a>
	{/each}
</nav>

<style>
	.app-nav {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.nav-divider {
		color: var(--text-secondary);
		opacity: 0.5;
		user-select: none;
	}

	.nav-link {
		font-family: var(--font-stats);
		font-size: 13px;
		font-weight: 400;
		letter-spacing: 0.02em;
		color: var(--text-secondary);
		text-decoration: none;
		padding: var(--space-xs) 0;
		border-bottom: 1px solid transparent;
		transition: color var(--transition-fast), border-color var(--transition-fast);
	}

	.nav-link:hover {
		color: var(--text-primary);
	}

	.nav-link.active {
		color: var(--text-primary);
		font-weight: 500;
		border-bottom-color: var(--accent-primary);
	}
</style>
