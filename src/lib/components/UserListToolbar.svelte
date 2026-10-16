<script>
	import { Search, SlidersHorizontal } from '@lucide/svelte';
	import { USER_STATUS, fmtNum } from '#lib/constants.js';

	/** tabs: [[status|null, label]];  */
	let { f, tabs, counts, placeholder = 'Cari nama, email, e-wallet, username sosmed…' } = $props();

	const count = (st) => (st && st !== 'all' ? (counts[st] ?? 0) : Object.values(counts).reduce((a, b) => a + b, 0));
	const href = (st) => (st ? `?status=${st}` : '?status=');
</script>

<div class="mb-5 flex flex-wrap gap-1.5">
	{#each tabs as [st, lbl]}
		{@const active = (f.status ?? null) === st}
		<a
			href={href(st)}
			class="inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition {active
				? 'bg-slate-900 text-white shadow-sm'
				: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}"
		>
			{lbl}
			<span
				class="rounded-full px-1.5 text-xs {active
					? 'bg-white/20'
					: st === 'pending' && count(st)
						? 'bg-amber-500 text-white'
						: 'bg-slate-100 text-slate-500'}">{fmtNum(count(st))}</span
			>
		</a>
	{/each}
</div>

<form method="GET" class="card mb-6 grid grid-cols-2 gap-3 p-4 md:grid-cols-12 lg:p-5">
	<!-- pertahankan urutan kolom saat mencari -->
	{#if f.sort?.key}<input type="hidden" name="sort" value={f.sort.key} /><input type="hidden" name="dir" value={f.sort.dir} />{/if}
	<input type="hidden" name="status" value={f.status ?? ''} />
	<div class="relative col-span-2 md:col-span-10">
		<Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
		<input class="input pl-9" name="q" value={f.q} {placeholder} aria-label="Cari user" />
	</div>
	<button class="btn btn-primary col-span-2 h-10 md:col-span-2"><SlidersHorizontal /> Terapkan</button>
</form>
