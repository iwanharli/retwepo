<script>
	import { Layers, Trash2 } from '@lucide/svelte';
	import { DELETED_RETENTION_DAYS } from '#lib/constants.js';
	import FilterTabs from './FilterTabs.svelte';
	/** counts: { active, deleted } */
	let { counts, status } = $props();
</script>

<FilterTabs
	current={status ?? null}
	items={[
		{ value: null, label: 'Aktif', count: counts.active, icon: Layers },
		{ value: 'deleted', label: 'Dihapus admin', count: counts.deleted, icon: Trash2, alert: 'rose' }
	]}
/>
{#if status === 'deleted'}
	<p class="-mt-2 mb-4 text-xs text-slate-500">Rekap yang dihapus lebih dari {DELETED_RETENTION_DAYS} hari dibersihkan permanen secara otomatis.</p>
{/if}
