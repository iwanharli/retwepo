<script>
	import { PLATFORMS, PLATFORM_KEYS } from '#lib/constants.js';
	import FilterTabs from './FilterTabs.svelte';
	import FilterBar from './FilterBar.svelte';
	import FilterSelect from './FilterSelect.svelte';

	/**
	 * tabs: [[status, label]] (opsional); counts: jumlah per status
	 * children: dropdown tambahan (mis. urutan) — namanya didaftarkan di `extra` (dan `uncounted` bila bukan filter)
	 */
	let { f, counts = {}, tabs = null, extra = [], uncounted = [], children = null } = $props();
</script>

{#if tabs}
	<FilterTabs current={f.status} items={tabs.map(([st, label]) => ({ value: st, label, count: counts[st] ?? 0, alert: st === 'pending' || st === 'rename' ? 'amber' : undefined }))} />
{/if}
<FilterBar search={{ value: f.q, placeholder: 'Cari username sosmed, nama atau email pemilik…' }} managed={['platform', ...extra]} {uncounted}>
	<FilterSelect name="platform" multiple value={f.platforms} all="Semua platform" options={PLATFORM_KEYS.map((k) => [k, PLATFORMS[k].label])} />
	{#if children}{@render children()}{/if}
</FilterBar>
