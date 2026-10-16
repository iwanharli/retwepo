<script>
	import { Search, SlidersHorizontal } from '@lucide/svelte';
	import { PLATFORMS, PLATFORM_KEYS, fmtNum } from '#lib/constants.js';
	import PlatformIcon from './PlatformIcon.svelte';

	/** tabs: [[status, label]] (opsional); keep: parameter tambahan yang dipertahankan di link & pencarian (mis. { owner }) */
	let { f, counts = {}, tabs = null, keep = {} } = $props();

	function href(params) {
		const u = new URLSearchParams();
		for (const [k, v] of Object.entries({ ...keep, status: f.status, platform: f.platform, ...params })) if (v) u.set(k, v);
		return '?' + u;
	}
</script>

<div class="mb-5 flex flex-wrap items-center gap-1.5">
	{#if tabs}
		{#each tabs as [st, lbl]}
			{@const active = f.status === st}
			<a
				href={href({ status: st })}
				class="inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition {active
					? 'bg-slate-900 text-white shadow-sm'
					: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}"
			>
				{lbl}
				<span
					class="rounded-full px-1.5 text-xs {active ? 'bg-white/20' : st === 'pending' && counts[st] ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}"
					>{fmtNum(counts[st] ?? 0)}</span
				>
			</a>
		{/each}
		<span class="mx-1 h-6 w-px bg-slate-200"></span>
	{/if}
	<!-- filter cepat per platform -->
	<a
		href={href({ platform: '' })}
		class="inline-flex h-9 items-center rounded-full px-3.5 text-sm font-medium transition {!f.platform
			? 'bg-brand-600 text-white'
			: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}">Semua platform</a
	>
	{#each PLATFORM_KEYS as k}
		<a
			href={href({ platform: k })}
			title={PLATFORMS[k].label}
			class="inline-flex h-9 items-center gap-2 rounded-full pr-3.5 pl-1.5 text-sm font-medium transition {f.platform === k
				? 'bg-white text-slate-900 ring-2 ring-brand-500'
				: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}"
		>
			<PlatformIcon platform={k} size={24} class="rounded-full" />{PLATFORMS[k].label}
		</a>
	{/each}
</div>

<form method="GET" class="card mb-6 grid grid-cols-2 gap-3 p-4 md:grid-cols-12 lg:p-5">
	<!-- pertahankan urutan kolom saat mencari -->
	{#if f.sort?.key}<input type="hidden" name="sort" value={f.sort.key} /><input type="hidden" name="dir" value={f.sort.dir} />{/if}
	{#if f.status}<input type="hidden" name="status" value={f.status} />{/if}
	{#each Object.entries(keep) as [k, v]}{#if v}<input type="hidden" name={k} value={v} />{/if}{/each}
	{#if f.platform}<input type="hidden" name="platform" value={f.platform} />{/if}
	<div class="relative col-span-2 md:col-span-10">
		<Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
		<input class="input pl-9" name="q" value={f.q} placeholder="Cari username sosmed, nama atau email pemilik…" aria-label="Cari akun" />
	</div>
	<button class="btn btn-primary col-span-2 h-10 md:col-span-2"><SlidersHorizontal /> Terapkan</button>
</form>
