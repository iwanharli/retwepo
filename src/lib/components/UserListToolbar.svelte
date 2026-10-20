<script>
	import FilterTabs from './FilterTabs.svelte';
	import FilterBar from './FilterBar.svelte';

	/** tabs: [[status, label]] — status 'all' = semua; counts: jumlah per status */
	let { f, tabs, counts, placeholder = 'Cari nama, email, e-wallet, username sosmed…' } = $props();

	const count = (st) => (st !== 'all' ? (counts[st] ?? 0) : Object.values(counts).reduce((a, b) => a + b, 0));
	const hasAll = $derived(tabs.some(([st]) => st === 'all'));
</script>

<FilterTabs current={f.status ?? (hasAll ? 'all' : null)} items={tabs.map(([st, label]) => ({ value: st, label, count: count(st), alert: st === 'pending' ? 'amber' : undefined }))} />
<FilterBar search={{ value: f.q, placeholder }} />
