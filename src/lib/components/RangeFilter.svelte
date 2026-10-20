<script>
	import { page } from '$app/state';
	import { CalendarDays } from '@lucide/svelte';
	import { PLATFORMS, PLATFORM_KEYS } from '#lib/constants.js';
	/** platform / campaign: undefined = filter tidak ditampilkan; campaigns: pilihan kampanye */
	let { from, to, platform = undefined, campaign = undefined, campaigns = [] } = $props();

	const fmt = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
	const today = fmt(new Date());
	const startOf = (days) => fmt(new Date(Date.now() - (days - 1) * 86400000));

	function preset(days) {
		const u = new URLSearchParams(page.url.search);
		u.set('from', startOf(days));
		u.set('to', today);
		return '?' + u.toString();
	}
	const presets = [['Hari ini', 1], ['7 hari', 7], ['30 hari', 30], ['90 hari', 90]];
	// preset yang sedang dipakai (null = rentang kustom)
	const activeDays = $derived(to === today ? (presets.find(([, n]) => from === startOf(n))?.[1] ?? null) : null);
</script>

<form method="GET" class="flex flex-wrap items-end gap-2">
	<!-- pertahankan tab yang sedang dibuka -->
	{#if page.url.searchParams.get('tab')}<input type="hidden" name="tab" value={page.url.searchParams.get('tab')} />{/if}
	<div class="flex rounded-lg bg-slate-100 p-1 ring-1 ring-slate-200">
		{#each presets as [lbl, n]}
			<a
				href={preset(n)}
				aria-current={activeDays === n ? 'true' : undefined}
				class="rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition {activeDays === n
					? 'bg-brand-600 text-white shadow-sm'
					: 'text-slate-600 hover:bg-white hover:text-slate-900'}">{lbl}</a
			>
		{/each}
		{#if activeDays === null}
			<span class="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm"><CalendarDays class="size-3.5" />Kustom</span>
		{/if}
	</div>
	<input class="input w-auto {activeDays === null ? 'border-brand-400 ring-2 ring-brand-500/15' : ''}" type="date" name="from" value={from} />
	<span class="pb-2 text-slate-400">–</span>
	<input class="input w-auto {activeDays === null ? 'border-brand-400 ring-2 ring-brand-500/15' : ''}" type="date" name="to" value={to} />
	{#if campaign !== undefined}
		<select class="input w-auto {campaign ? 'border-brand-400 bg-brand-50 font-medium text-brand-700 ring-2 ring-brand-500/15' : ''}" name="campaign" value={campaign ?? ''}>
			<option value="">Semua kampanye</option>
			{#each campaigns as c (c.id)}<option value={c.id}>#{c.name}</option>{/each}
		</select>
	{/if}
	{#if platform !== undefined}
		<select class="input w-auto {platform ? 'border-brand-400 bg-brand-50 font-medium text-brand-700 ring-2 ring-brand-500/15' : ''}" name="platform" value={platform ?? ''}>
			<option value="">Semua platform</option>
			{#each PLATFORM_KEYS as k}<option value={k}>{PLATFORMS[k].label}</option>{/each}
		</select>
	{/if}
	<button class="btn btn-primary">Terapkan</button>
</form>
