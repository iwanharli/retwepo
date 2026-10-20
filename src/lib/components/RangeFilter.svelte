<script>
	import { PLATFORMS, PLATFORM_KEYS } from '#lib/constants.js';
	import FilterBar from './FilterBar.svelte';
	import FilterSelect from './FilterSelect.svelte';

	/**
	 * Filter rentang tanggal (+ kampanye / platform opsional) dalam kartu filter standar.
	 * platforms / campaign: undefined = dropdown tidak ditampilkan; campaigns: pilihan kampanye
	 * children: dropdown tambahan, namanya didaftarkan di `extra`
	 */
	let { from, to, platforms = undefined, campaign = undefined, campaigns = [], extra = [], search = null, children = null } = $props();
	const managed = $derived([...(campaign !== undefined ? ['campaign'] : []), ...(platforms !== undefined ? ['platform'] : []), ...extra]);
</script>

<FilterBar dates={{ from, to }} {managed} {search}>
	{#if campaign !== undefined}
		<FilterSelect name="campaign" value={campaign ?? ''} all="Semua kampanye" options={campaigns.map((c) => [c.id, `#${c.name}`])} />
	{/if}
	{#if platforms !== undefined}
		<FilterSelect name="platform" multiple value={platforms} all="Semua platform" options={PLATFORM_KEYS.map((k) => [k, PLATFORMS[k].label])} />
	{/if}
	{#if children}{@render children()}{/if}
</FilterBar>
