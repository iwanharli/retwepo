<script>
	import { Dialog } from 'bits-ui';
	import { Download, X, FileSpreadsheet, CalendarDays, SlidersHorizontal, Info, ListChecks } from '@lucide/svelte';
	import { PLATFORMS, PLATFORM_KEYS, fmtDate } from '#lib/constants.js';
	import PlatformIcon from './PlatformIcon.svelte';

	/**
	 * Modal pengaturan export CSV (dipakai export user & akun sosmed).
	 * action: URL endpoint; statuses: [[value, label]]; defaultStatuses: status terpilih saat dibuka
	 * columns: [{ key, label, default }]; platformFilter: tampilkan pilihan platform
	 * q / platform: filter halaman yang ikut terbawa; rangeHint: keterangan rentang tanggal
	 */
	let {
		action,
		title,
		description = '',
		statuses,
		defaultStatuses = [],
		columns,
		platformFilter = false,
		q = '',
		platform: pagePlatform = null,
		rangeHint = 'Dipakai untuk menghitung jumlah rekap.',
		ownerFilter = null, // null = tidak ditampilkan; true/false = nilai awal "hanya pemilik terverifikasi"
		triggerClass = 'btn btn-secondary'
	} = $props();

	let open = $state(false);
	let sel = $state([]);
	let cols = $state([]);
	let from = $state('');
	let to = $state('');
	let platform = $state('');
	let sep = $state('semicolon');
	let verifiedOwners = $state(false);

	// isi ulang dari kondisi halaman setiap kali modal dibuka
	function onOpenChange(v) {
		if (!v) return;
		sel = defaultStatuses.length ? [...defaultStatuses] : statuses.map(([s]) => s);
		cols = columns.filter((c) => c.default).map((c) => c.key);
		from = '';
		to = '';
		platform = pagePlatform ?? '';
		verifiedOwners = ownerFilter === true;
	}

	const ymd = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
	function preset(days) {
		if (!days) return ((from = ''), (to = ''));
		to = ymd(new Date());
		from = ymd(new Date(Date.now() - (days - 1) * 86400000));
	}
	function thisMonth() {
		const now = new Date();
		const t = ymd(now);
		from = t.slice(0, 8) + '01';
		to = t;
	}
	const rangeText = $derived(from || to ? `${from ? fmtDate(from) : 'awal'} – ${to ? fmtDate(to) : 'sekarang'}` : 'Semua waktu');
	const canSubmit = $derived(sel.length > 0 && cols.length > 0);
</script>

<Dialog.Root bind:open {onOpenChange}>
	<Dialog.Trigger class={triggerClass}><Download /> Export CSV</Dialog.Trigger>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
		>
			<form method="GET" {action} data-sveltekit-reload class="flex min-h-0 flex-1 flex-col" onsubmit={() => setTimeout(() => (open = false), 300)}>
				<div class="flex items-start gap-4 border-b border-slate-100 px-6 py-5">
					<span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
						<FileSpreadsheet class="size-5" />
					</span>
					<div class="flex-1">
						<Dialog.Title class="font-semibold text-slate-900">{title}</Dialog.Title>
						{#if description}<Dialog.Description class="mt-0.5 text-sm text-slate-500">{description}</Dialog.Description>{/if}
					</div>
					<Dialog.Close class="btn btn-ghost btn-icon -mt-1 -mr-2" aria-label="Tutup"><X /></Dialog.Close>
				</div>

				<div class="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
					<!-- Status -->
					<section>
						<h3 class="label">Status</h3>
						<div class="flex flex-wrap gap-2">
							{#each statuses as [val, lbl]}
								<label
									class="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition {sel.includes(val)
										? 'border-brand-200 bg-brand-50/60 text-slate-900'
										: 'border-slate-200 text-slate-600 hover:bg-slate-50'}"
								>
									<input type="checkbox" name="status" value={val} bind:group={sel} class="size-4 accent-brand-600" />{lbl}
								</label>
							{/each}
						</div>
					</section>

					<!-- Rentang -->
					<section>
						<h3 class="label flex items-center gap-1.5"><CalendarDays class="size-4 text-slate-400" /> Rentang tanggal rekap</h3>
						<div class="mb-2.5 flex flex-wrap gap-1.5">
							<button type="button" class="inline-flex h-7 items-center rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-600 hover:bg-slate-200" onclick={thisMonth}>Bulan ini</button>
							{#each [[7, '7 hari'], [30, '30 hari'], [90, '90 hari'], [null, 'Semua waktu']] as [d, lbl]}
								<button type="button" class="inline-flex h-7 items-center rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-600 hover:bg-slate-200" onclick={() => preset(d)}>{lbl}</button>
							{/each}
						</div>
						<div class="flex items-center gap-2">
							<input class="input" type="date" name="from" bind:value={from} aria-label="Dari tanggal" />
							<span class="text-slate-400">–</span>
							<input class="input" type="date" name="to" bind:value={to} aria-label="Sampai tanggal" />
						</div>
						<p class="hint">Dipilih: <b class="text-slate-700">{rangeText}</b> · {rangeHint}</p>
					</section>

					{#if platformFilter}
						<section>
							<h3 class="label flex items-center gap-1.5"><SlidersHorizontal class="size-4 text-slate-400" /> Platform</h3>
							<div class="flex flex-wrap gap-2">
								<label class="flex cursor-pointer items-center rounded-lg border px-3 py-2 text-sm transition {platform === '' ? 'border-brand-200 bg-brand-50/60' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}">
									<input type="radio" name="platform" value="" bind:group={platform} class="sr-only" />Semua
								</label>
								{#each PLATFORM_KEYS as k}
									<label
										class="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition {platform === k
											? 'border-brand-200 bg-brand-50/60'
											: 'border-slate-200 text-slate-600 hover:bg-slate-50'}"
									>
										<input type="radio" name="platform" value={k} bind:group={platform} class="sr-only" /><PlatformIcon platform={k} size={18} />{PLATFORMS[k].label}
									</label>
								{/each}
							</div>
						</section>
					{/if}

					{#if ownerFilter !== null}
						<label class="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-sm hover:bg-slate-50">
							<input type="checkbox" name="owner" value="verified" bind:checked={verifiedOwners} class="mt-0.5 size-4 accent-brand-600" />
							<span>
								<span class="block font-medium">Hanya akun dari user terverifikasi</span>
								<span class="block text-xs text-slate-500">Sama seperti daftar di halaman ini. Hapus centang untuk ikut menyertakan akun milik pendaftar baru.</span>
							</span>
						</label>
					{/if}

					{#if q}
						<input type="hidden" name="q" value={q} />
						<p class="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"><Info class="size-3.5" /> Pencarian "<b>{q}</b>" yang aktif di halaman ikut diterapkan.</p>
					{/if}

					<!-- Kolom -->
					<section>
						<div class="mb-1.5 flex items-center justify-between">
							<h3 class="flex items-center gap-1.5 text-sm font-medium text-slate-700"><ListChecks class="size-4 text-slate-400" /> Kolom ({cols.length})</h3>
							<div class="flex gap-1">
								<button type="button" class="btn btn-ghost btn-sm" onclick={() => (cols = columns.map((c) => c.key))}>Pilih semua</button>
								<button type="button" class="btn btn-ghost btn-sm" onclick={() => (cols = [])}>Kosongkan</button>
							</div>
						</div>
						<div class="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
							{#each columns as c}
								<label
									class="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition {cols.includes(c.key)
										? 'border-brand-200 bg-brand-50/60 text-slate-900'
										: 'border-slate-200 text-slate-600 hover:bg-slate-50'}"
								>
									<input type="checkbox" name="col" value={c.key} bind:group={cols} class="size-4 accent-brand-600" />{c.label}
								</label>
							{/each}
						</div>
					</section>

					<!-- Pemisah -->
					<section>
						<h3 class="label">Pemisah kolom</h3>
						<div class="grid gap-3 sm:grid-cols-2">
							{#each [['semicolon', 'Titik koma ( ; )', 'Excel dengan bahasa/regional Indonesia'], ['comma', 'Koma ( , )', 'Google Sheets, Excel bahasa Inggris']] as [val, lbl, desc]}
								<label class="flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition {sep === val ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 hover:bg-slate-50'}">
									<input type="radio" name="sep" value={val} bind:group={sep} class="mt-0.5 size-4 accent-brand-600" />
									<span><span class="block text-sm font-medium">{lbl}</span><span class="block text-xs text-slate-500">{desc}</span></span>
								</label>
							{/each}
						</div>
					</section>
				</div>

				<div class="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
					{#if !canSubmit}<span class="mr-auto text-xs text-rose-600">Pilih minimal satu status dan satu kolom.</span>{/if}
					<Dialog.Close type="button" class="btn btn-secondary">Batal</Dialog.Close>
					<button class="btn btn-success" disabled={!canSubmit}><Download /> Download CSV</button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
