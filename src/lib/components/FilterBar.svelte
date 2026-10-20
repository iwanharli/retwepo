<script>
	import { setContext, untrack } from 'svelte';
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
	// tanggal di drawer: pilihan cepat hanya mengisi kolom, diterapkan saat "Tampilkan hasil"
	let fromV = $state(untrack(() => dates?.from ?? ''));
	let toV = $state(untrack(() => dates?.to ?? ''));
	$effect.pre(() => {
		fromV = dates?.from ?? '';
		toV = dates?.to ?? '';
	});
	function setPreset(n) {
		fromV = n ? startOf(n) : '';
		toV = n ? today : '';
	}
	const draftPreset = $derived.by(() => {
		if (!fromV && !toV) return dates?.allowAll ? 0 : null;
		if (toV !== today) return null;
		return PRESETS.find(([, n]) => n && fromV === startOf(n))?.[1] ?? null;
	});
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
			<button type="button" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px]" transition:fade={{ duration: 180 }} onclick={() => (open = false)} aria-label="Tutup filter"></button>
		{/if}
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Filter"
			class="fixed inset-y-0 right-0 z-50 flex w-full max-w-[26rem] flex-col overflow-hidden bg-slate-50 shadow-2xl transition-transform duration-300 ease-out sm:inset-y-3 sm:right-3 sm:rounded-2xl {open ? 'translate-x-0' : 'pointer-events-none translate-x-[110%]'}"
			inert={!open}
		>
			<!-- kepala -->
			<div class="relative flex items-start gap-3 overflow-hidden bg-gradient-to-br from-brand-600 to-violet-700 px-5 pt-5 pb-6 text-white">
				<div class="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-white/10"></div>
				<span class="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25"><SlidersHorizontal class="size-5" /></span>
				<div class="relative min-w-0 flex-1">
					<h2 class="text-lg font-semibold">Filter data</h2>
					<p class="text-xs text-white/75">{activeCount ? `${activeCount} filter aktif` : 'Atur data yang ingin ditampilkan'}</p>
				</div>
				<button type="button" class="relative -mt-1 -mr-1 flex size-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/15 hover:text-white" onclick={() => (open = false)} aria-label="Tutup"><X class="size-5" /></button>
			</div>

			<div class="-mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4">
				{#if dates}
					<section class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
						<h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900"><span class="flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><CalendarDays class="size-4" /></span>Periode</h3>
						<div class="grid grid-cols-3 gap-1.5">
							{#each PRESETS as [lbl, n]}
								{@const on = draftPreset === n}
								<button type="button" onclick={() => setPreset(n)} class="rounded-lg px-2 py-2 text-center text-[13px] font-medium transition {on ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">{lbl}</button>
							{/each}
						</div>
						<div class="mt-3 grid grid-cols-2 gap-2">
							<label class="block"><span class="mb-1 block text-xs font-medium text-slate-500">Dari</span><input class="input {draftPreset === null ? 'border-brand-400 ring-2 ring-brand-500/15' : ''}" type="date" name="from" bind:value={fromV} /></label>
							<label class="block"><span class="mb-1 block text-xs font-medium text-slate-500">Sampai</span><input class="input {draftPreset === null ? 'border-brand-400 ring-2 ring-brand-500/15' : ''}" type="date" name="to" bind:value={toV} /></label>
						</div>
					</section>
				{/if}
				{#if children}
					<section class="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
						<h3 class="flex items-center gap-2 text-sm font-semibold text-slate-900"><span class="flex size-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><SlidersHorizontal class="size-4" /></span>Saring data</h3>
						{@render children()}
					</section>
				{/if}
				{#if chips}
					<section class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
						<h3 class="mb-2 text-sm font-semibold text-slate-900">Dari halaman lain</h3>
						<div class="flex flex-wrap gap-1.5">{@render chips()}</div>
					</section>
				{/if}
			</div>

			<!-- kaki -->
			<div class="flex items-center gap-2 border-t border-slate-200 bg-white px-4 py-3.5">
				{#if activeCount}<a href={resetHref} class="btn btn-ghost h-11 text-slate-500 hover:text-rose-600"><FunnelX /> Reset</a>{/if}
				<button class="btn btn-primary h-11 flex-1 text-[15px] shadow-md shadow-brand-600/25">Tampilkan hasil</button>
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
