<script>
	import { page } from '$app/state';
	import { Search, SlidersHorizontal, FunnelX, CalendarDays, ChevronDown } from '@lucide/svelte';

	/**
	 * Kartu filter yang sama untuk semua halaman.
	 *
	 * dates:   { from, to, allowAll } — pilihan cepat + rentang tanggal (from/to kosong = tanpa batas, hanya bila allowAll)
	 * search:  { value, placeholder, name = 'q' }
	 * managed: nama parameter yang diatur oleh dropdown di `children` (dipakai untuk hitung filter aktif & Reset)
	 * uncounted: bagian dari `managed` yang bukan filter (mis. urutan) — tidak dihitung sebagai filter aktif
	 * chips:   snippet chip filter tambahan (mis. user/akun dari halaman lain)
	 * children: dropdown filter (FilterSelect)
	 * Parameter lain di URL (tab, status, view, sort, …) otomatis ikut terbawa.
	 */
	let { dates = null, search = null, managed = [], uncounted = [], chips = null, children = null } = $props();

	const searchName = $derived(search?.name ?? 'q');
	// semua parameter yang dikendalikan kartu ini
	const own = $derived([...managed, ...(search ? [searchName] : []), ...(dates ? ['from', 'to'] : []), 'page']);
	// parameter lain yang ikut terbawa (status kosong tetap dibawa: artinya "Semua")
	const kept = $derived([...page.url.searchParams].filter(([k, v]) => !own.includes(k) && (v !== '' || k === 'status')));

	// filter aktif = dropdown/cari yang terisi (tanggal tidak dihitung)
	const activeCount = $derived([...managed, ...(search ? [searchName] : [])].filter((k) => !uncounted.includes(k) && page.url.searchParams.get(k)).length);
	const resetHref = $derived.by(() => {
		// reset dropdown & pencarian; tanggal dan parameter lain tetap
		const u = new URLSearchParams(kept);
		for (const k of ['from', 'to']) if (dates && page.url.searchParams.has(k)) u.set(k, page.url.searchParams.get(k));
		const q = u.toString();
		return q ? `?${q}` : page.url.pathname;
	});

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

	let open = $state(false); // tampilan HP: kartu bisa dilipat
</script>

<form method="GET" class="card mb-6 p-0">
	{#each kept as [k, v]}<input type="hidden" name={k} value={v} />{/each}

	<!-- HP: tombol lipat -->
	<button type="button" class="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium md:hidden" onclick={() => (open = !open)} aria-expanded={open}>
		<span class="flex items-center gap-2"><SlidersHorizontal class="size-4 text-slate-400" /> Filter{#if activeCount}<span class="rounded-full bg-brand-600 px-1.5 text-xs text-white">{activeCount}</span>{/if}</span>
		<ChevronDown class="size-4 text-slate-400 transition {open ? 'rotate-180' : ''}" />
	</button>

	<div class="{open ? 'block' : 'hidden'} border-t border-slate-100 md:block md:border-0">
		{#if dates || chips}
			<!-- baris 1: tanggal & chip -->
			<div class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3 lg:px-5">
				{#if dates}
					<div class="flex flex-wrap rounded-lg bg-slate-100 p-1 ring-1 ring-slate-200">
						{#each PRESETS as [lbl, n]}
							<a
								href={presetHref(n)}
								aria-current={activePreset === n ? 'true' : undefined}
								class="rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition {activePreset === n ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900'}">{lbl}</a
							>
						{/each}
						{#if activePreset === null}
							<span class="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm"><CalendarDays class="size-3.5" />Kustom</span>
						{/if}
					</div>
					<div class="flex items-center gap-2">
						<input class="input w-auto {activePreset === null ? 'border-brand-400 ring-2 ring-brand-500/15' : ''}" type="date" name="from" value={dates.from ?? ''} aria-label="Dari tanggal" />
						<span class="text-slate-400">–</span>
						<input class="input w-auto {activePreset === null ? 'border-brand-400 ring-2 ring-brand-500/15' : ''}" type="date" name="to" value={dates.to ?? ''} aria-label="Sampai tanggal" />
					</div>
				{/if}
				{#if chips}<div class="flex flex-wrap items-center gap-2">{@render chips()}</div>{/if}
			</div>
		{/if}

		<!-- baris 2: cari, dropdown, aksi -->
		<div class="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-5">
			{#if search}
				<div class="relative min-w-full flex-1 sm:min-w-64">
					<Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
					<input class="input pl-9 {search.value ? 'border-brand-400 ring-2 ring-brand-500/15' : ''}" name={searchName} value={search.value ?? ''} placeholder={search.placeholder} aria-label="Cari" />
				</div>
			{/if}
			{#if children}{@render children()}{/if}
			<div class="ml-auto flex items-center gap-3">
				{#if activeCount}
					<a href={resetHref} class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-rose-600"><FunnelX class="size-4" />{activeCount} filter aktif · Reset</a>
				{/if}
				<button class="btn btn-primary"><SlidersHorizontal /> Terapkan</button>
			</div>
		</div>
	</div>
</form>
