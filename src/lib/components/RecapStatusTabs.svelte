<script>
	import { page } from '$app/state';
	import { Layers, Trash2 } from '@lucide/svelte';
	import { fmtNum, DELETED_RETENTION_DAYS } from '#lib/constants.js';
	/** counts: { active, deleted } */
	let { counts, status } = $props();

	function href(s) {
		const u = new URLSearchParams(page.url.search);
		u.delete('page');
		if (s) u.set('status', s);
		else u.delete('status');
		return '?' + u;
	}
</script>

<div class="mb-4 flex flex-wrap gap-1.5">
	<a
		href={href(null)}
		class="inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition {!status
			? 'bg-slate-900 text-white shadow-sm'
			: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}"
	>
		<Layers class="size-4" /> Aktif <span class="rounded-full px-1.5 text-xs {!status ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}">{fmtNum(counts.active)}</span>
	</a>
	<a
		href={href('deleted')}
		class="inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition {status === 'deleted'
			? 'bg-rose-600 text-white shadow-sm'
			: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}"
	>
		<Trash2 class="size-4" /> Dihapus admin
		<span class="rounded-full px-1.5 text-xs {status === 'deleted' ? 'bg-white/20' : counts.deleted ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}">{fmtNum(counts.deleted)}</span>
	</a>
	{#if status === 'deleted'}
		<span class="ml-1 self-center text-xs text-slate-500">Rekap yang dihapus lebih dari {DELETED_RETENTION_DAYS} hari dibersihkan permanen secara otomatis.</span>
	{/if}
</div>
