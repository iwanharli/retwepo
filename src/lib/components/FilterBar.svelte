<script>
	import { setContext } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { page } from '$app/state';
	import { Search, SlidersHorizontal, FunnelX, CalendarDays, X } from '@lucide/svelte';

	/**
	 * Filter standar semua halaman: bar ringkas (cari + tombol Filter + chip filter aktif)
	 * dengan panel samping (drawer) berisi tanggal & dropdown.
	 *
	 * dates:     { from, to, allowAll } — pilihan cepat + rentang tanggal
	 * search:    { value, placeholder, name = 'q' }
	 * managed:   nama parameter dropdown di `children` (untuk hitung filter aktif & Reset)
	 * uncounted: bagian dari `managed` yang bukan filter (mis. urutan)
	 * chips:     snippet chip filter tambahan (mis. user/akun dari halaman lain)
	 * children:  dropdown filter (FilterSelect) — tampil di drawer
	 * Parameter lain di URL (tab, status, view, sort, …) otomatis ikut terbawa.
	 */
	let { dates = null, search = null, managed = [], uncounted = [], chips = null, children = null } = $props();

	// FilterSelect mendaftarkan diri (sinkron, saat dibuat) agar nilainya bisa tampil sebagai chip di bar.
	// Drawer dirender lebih dulu di markup supaya pendaftaran selesai sebelum bar dirender (juga di server).
	const selects = {};
	setContext('filterbar', { register: (name, info) => (selects[name] = info) });

	const searchName = $derived(search?.name ?? 'q');
	const own = $derived([...managed, ...(search ? [searchName] : []), ...(dates ? ['from', 'to'] : []), 'page']);
	// parameter lain yang ikut terbawa (status kosong tetap dibawa: artinya "Semua")
	const kept = $derived([...page.url.searchParams].filter(([k, v]) => !own.includes(k) && (v !== '' || k === 'status')));
	const hasDrawer = $derived(Boolean(dates || children || chips));

	// ---- filter aktif → chip
	const params = $derived(page.url.searchParams);
	const activeSelects = $derived(
		managed
			.filter((k) => !uncounted.includes(k) && params.get(k))
			.map((k) => {
				const s = selects[k];
				const label = s?.options.find(([v]) => String(v) === params.get(k))?.[1] ?? params.get(k);
				return { key: k, label };
			})
	);
	const activeCount = $derived(activeSelects.length + (search && params.get(searchName) ? 1 : 0));
	function without(...keys) {
		const u = new URLSearchParams(page.url.search);
		for (const k of [...keys, 'page']) u.delete(k);
		const q = u.toString();
		return q ? `?${q}` : page.url.pathname;
	}
	// reset dropdown & pencarian; tanggal dan parameter lain tetap
	const resetHref = $derived(without(...managed.filter((k) => !uncounted.includes(k)), ...(search ? [searchName] : [])));

	// ---- pilihan cepat tanggal (WIB)
	const ymd = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
	const today = ymd(new Date());
	const startOf = (n) => ymd(new Date(Date.now() - (n - 1) * 86400000));
	const PRESETS = $derived([['Hari ini', 1], ['7 hari', 7], ['30 hari', 30], ['90 hari', 90], ...(dates?.allowAll ? [['Semua', 0]] : [])]);
	function presetHref(n) {
		const u = new URLSearchParams(page.url.search);
		u.delete('page');
		u.set('from', n ? startOf(n) : '');
		u.set('to', n ? today : '');
		return '?' + u;
	}
	const activePreset = $derived.by(() => {
		if (!dates) return null;
		if (!dates.from && !dates.to) return dates.allowAll ? 0 : null;
		if (dates.to !== today) return null;
		return PRESETS.find(([, n]) => n && dates.from === startOf(n))?.[1] ?? null;
	});
	const fmt = (d) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`));
	const periodLabel = $derived.by(() => {
		if (!dates) return '';
		if (activePreset !== null) return PRESETS.find(([, n]) => n === activePreset)?.[0] === 'Semua' ? 'Semua waktu' : PRESETS.find(([, n]) => n === activePreset)?.[0];
		return `${dates.from ? fmt(dates.from) : 'awal'} – ${dates.to ? fmt(dates.to) : 'sekarang'}`;
	});

	// ---- drawer
	let open = $state(false);
	function onkeydown(e) {
		if (open && e.key === 'Escape') open = false;
	}
	const chipCls = 'inline-flex h-7 items-center gap-1 rounded-full bg-brand-50 pr-1.5 pl-2.5 text-xs font-medium text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100';
</script>

<svelte:window {onkeydown} />

<form method="GET" class="mb-6">
	{#each kept as [k, v]}<input type="hidden" name={k} value={v} />{/each}

	<!-- drawer: tetap di dalam form (disembunyikan saat tertutup) agar semua isian ikut terkirim -->
	{#if hasDrawer}
		{#if open}
			<button type="button" class="fixed inset-0 z-50 bg-slate-900/40" transition:fade={{ duration: 150 }} onclick={() => (open = false)} aria-label="Tutup filter"></button>
		{/if}
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Filter"
			class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-200 {open ? 'translate-x-0' : 'pointer-events-none translate-x-full'}"
			inert={!open}
		>
			<div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
				<h2 class="flex items-center gap-2 font-semibold text-slate-900"><SlidersHorizontal class="size-4 text-slate-400" /> Filter</h2>
				<button type="button" class="btn btn-ghost btn-icon" onclick={() => (open = false)} aria-label="Tutup"><X /></button>
			</div>

			<div class="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
				{#if dates}
					<section>
						<h3 class="label flex items-center gap-1.5"><CalendarDays class="size-4 text-slate-400" /> Periode</h3>
						<div class="grid grid-cols-3 gap-1.5">
							{#each PRESETS as [lbl, n]}
								<a
									href={presetHref(n)}
									aria-current={activePreset === n ? 'true' : undefined}
									class="rounded-lg px-3 py-2 text-center text-sm font-medium transition {activePreset === n ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">{lbl}</a
								>
							{/each}
						</div>
						<div class="mt-3 grid grid-cols-2 gap-2">
							<label class="text-xs text-slate-500">Dari<input class="input mt-1 {activePreset === null ? 'border-brand-400 ring-2 ring-brand-500/15' : ''}" type="date" name="from" value={dates.from ?? ''} /></label>
							<label class="text-xs text-slate-500">Sampai<input class="input mt-1 {activePreset === null ? 'border-brand-400 ring-2 ring-brand-500/15' : ''}" type="date" name="to" value={dates.to ?? ''} /></label>
						</div>
					</section>
				{/if}
				{#if children}
					<section class="space-y-3 [&_select]:w-full">
						<h3 class="label mb-0 flex items-center gap-1.5"><SlidersHorizontal class="size-4 text-slate-400" /> Saring data</h3>
						{@render children()}
					</section>
				{/if}
				{#if chips}
					<section>
						<h3 class="label">Dari halaman lain</h3>
						<div class="flex flex-wrap gap-1.5">{@render chips()}</div>
					</section>
				{/if}
			</div>

			<div class="flex items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
				{#if activeCount}<a href={resetHref} class="btn btn-ghost text-slate-500"><FunnelX /> Reset</a>{/if}
				<button class="btn btn-primary ml-auto"><SlidersHorizontal /> Terapkan</button>
			</div>
		</div>
	{/if}

	<!-- bar ringkas -->
	<div class="card flex flex-wrap items-center gap-2 p-3 lg:p-3.5">
		{#if search}
			<div class="relative min-w-48 flex-1">
				<Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
				<input class="input pl-9 {search.value ? 'border-brand-400 ring-2 ring-brand-500/15' : ''}" name={searchName} value={search.value ?? ''} placeholder={search.placeholder} aria-label="Cari" />
			</div>
		{/if}
		{#if hasDrawer}
			<button type="button" class="btn btn-secondary h-10 {search ? '' : 'flex-1 justify-start sm:flex-none'}" onclick={() => (open = true)} aria-expanded={open}>
				<SlidersHorizontal /> Filter
				{#if activeCount - (search && params.get(searchName) ? 1 : 0)}<span class="rounded-full bg-brand-600 px-1.5 text-xs text-white">{activeCount - (search && params.get(searchName) ? 1 : 0)}</span>{/if}
			</button>
		{/if}
		{#if search && !hasDrawer}<button class="btn btn-primary h-10"><Search /> Cari</button>{/if}

		<!-- chip filter aktif -->
		{#if dates || activeSelects.length || chips || activeCount}
			<div class="flex w-full flex-wrap items-center gap-1.5 {search || hasDrawer ? 'border-t border-slate-100 pt-2.5' : ''}">
				{#if dates}
					<button type="button" class="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-200" onclick={() => (open = true)}>
						<CalendarDays class="size-3.5 text-slate-400" />{periodLabel}
					</button>
				{/if}
				{#each activeSelects as a (a.key)}
					<a href={without(a.key)} class={chipCls} title="Hapus filter">{a.label}<X class="size-3.5 opacity-60" /></a>
				{/each}
				{#if chips}{@render chips()}{/if}
				{#if activeCount}
					<a href={resetHref} class="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600"><FunnelX class="size-3.5" />Reset</a>
				{/if}
			</div>
		{/if}
	</div>

</form>
