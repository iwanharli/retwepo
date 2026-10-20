<script>
	import { Dialog } from 'bits-ui';
	import { Download, X, FileSpreadsheet, ListChecks, UsersRound, CalendarDays, SlidersHorizontal, Info } from '@lucide/svelte';
	import { EXPORT_COLUMNS, PLATFORMS, PLATFORM_KEYS, fmtDate } from '#lib/constants.js';

	/** f: filter yang sedang aktif di halaman (dipakai sebagai nilai awal) */
	/** campaigns: daftar kampanye untuk filter */
	let { f, campaigns = [], action = '/admin/export/recaps' } = $props();

	let open = $state(false);
	let mode = $state('detail');
	let from = $state('');
	let to = $state('');
	let platform = $state('');
	let type = $state('');
	let campaign = $state('');
	let sep = $state('semicolon');
	let cols = $state(EXPORT_COLUMNS.filter((c) => c.default).map((c) => c.key));

	// setiap kali modal dibuka, isi ulang dari filter halaman
	function onOpenChange(v) {
		if (!v) return;
		from = f.from ?? '';
		to = f.to ?? '';
		platform = f.platform ?? '';
		type = f.type ?? '';
		campaign = f.campaign ?? '';
	}

	const ymd = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
	function preset(days) {
		if (!days) return ((from = ''), (to = ''));
		to = ymd(new Date());
		from = ymd(new Date(Date.now() - (days - 1) * 86400000));
	}
	const presets = [[7, '7 hari'], [30, '30 hari'], [90, '90 hari'], [null, 'Semua waktu']];

	const rangeText = $derived(from || to ? `${from ? fmtDate(from) : 'awal'} – ${to ? fmtDate(to) : 'sekarang'}` : 'Semua waktu');
	const canSubmit = $derived(mode === 'summary' || cols.length > 0);
</script>

<Dialog.Root bind:open {onOpenChange}>
	<Dialog.Trigger class="btn btn-secondary btn-sm ml-auto"><Download /> Export CSV</Dialog.Trigger>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
		>
			<form method="GET" {action} data-sveltekit-reload class="flex min-h-0 flex-1 flex-col" onsubmit={() => setTimeout(() => (open = false), 300)}>
				<!-- Header -->
				<div class="flex items-start gap-4 border-b border-slate-100 px-6 py-5">
					<span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
						<FileSpreadsheet class="size-5" />
					</span>
					<div class="flex-1">
						<Dialog.Title class="font-semibold text-slate-900">Export rekap ke CSV</Dialog.Title>
						<Dialog.Description class="mt-0.5 text-sm text-slate-500">Atur data yang ingin diunduh. File bisa dibuka di Excel atau Google Sheets.</Dialog.Description>
					</div>
					<Dialog.Close class="btn btn-ghost btn-icon -mt-1 -mr-2" aria-label="Tutup"><X /></Dialog.Close>
				</div>

				<div class="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
					<!-- Jenis laporan -->
					<section>
						<h3 class="label">Jenis laporan</h3>
						<div class="grid gap-3 sm:grid-cols-2">
							{#each [['detail', 'Detail rekap', 'Satu baris per rekap, lengkap dengan URL & screenshot', ListChecks], ['summary', 'Ringkasan per user', 'Total postingan/panel per user + e-wallet, cocok untuk pembayaran', UsersRound]] as [val, lbl, desc, Icon]}
								<label
									class="flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition {mode === val
										? 'border-brand-500 bg-brand-50/50 ring-4 ring-brand-500/10'
										: 'border-slate-200 hover:bg-slate-50'}"
								>
									<input type="radio" name="mode" value={val} bind:group={mode} class="sr-only" />
									<span class="flex size-8 shrink-0 items-center justify-center rounded-lg {mode === val ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}">
										<Icon class="size-4" />
									</span>
									<span>
										<span class="block text-sm font-semibold">{lbl}</span>
										<span class="block text-xs text-slate-500">{desc}</span>
									</span>
								</label>
							{/each}
						</div>
					</section>

					<!-- Rentang tanggal -->
					<section>
						<h3 class="label flex items-center gap-1.5"><CalendarDays class="size-4 text-slate-400" /> Rentang tanggal posting</h3>
						<div class="mb-2.5 flex flex-wrap gap-1.5">
							{#each presets as [days, lbl]}
								<button type="button" class="inline-flex h-7 items-center rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-600 hover:bg-slate-200" onclick={() => preset(days)}>{lbl}</button>
							{/each}
						</div>
						<div class="flex items-center gap-2">
							<input class="input" type="date" name="from" bind:value={from} aria-label="Dari tanggal" />
							<span class="text-slate-400">–</span>
							<input class="input" type="date" name="to" bind:value={to} aria-label="Sampai tanggal" />
						</div>
						<p class="hint">Dipilih: <b class="text-slate-700">{rangeText}</b></p>
					</section>

					<!-- Filter -->
					<section>
						<h3 class="label flex items-center gap-1.5"><SlidersHorizontal class="size-4 text-slate-400" /> Filter</h3>
						<div class="grid gap-3 sm:grid-cols-3">
							<select class="input" name="campaign" bind:value={campaign}>
								<option value="">Semua kampanye</option>
								{#each campaigns as c (c.id)}<option value={c.id}>#{c.name}</option>{/each}
							</select>
							<select class="input" name="platform" bind:value={platform}>
								<option value="">Semua platform</option>
								{#each PLATFORM_KEYS as k}<option value={k}>{PLATFORMS[k].label}</option>{/each}
							</select>
							<select class="input" name="type" bind:value={type}>
								<option value="">Postingan & panel</option>
								<option value="post">Postingan saja</option>
								<option value="reply">Panel saja</option>
							</select>
						</div>
						<!-- filter lain dari halaman ikut terbawa -->
						{#if f.q}<input type="hidden" name="q" value={f.q} />{/if}
						{#if f.user}<input type="hidden" name="user" value={f.user} />{/if}
						{#if f.account}<input type="hidden" name="account" value={f.account} />{/if}
						{#if f.evidence}<input type="hidden" name="evidence" value={f.evidence} />{/if}
						{#if f.q || f.user || f.account || f.evidence}
							<p class="hint flex items-center gap-1.5"><Info class="size-3.5" /> Pencarian / filter user yang sedang aktif di halaman ikut diterapkan.</p>
						{/if}
					</section>

					<!-- Kolom -->
					{#if mode === 'detail'}
						<section>
							<div class="mb-1.5 flex items-center justify-between">
								<h3 class="text-sm font-medium text-slate-700">Kolom ({cols.length})</h3>
								<div class="flex gap-1">
									<button type="button" class="btn btn-ghost btn-sm" onclick={() => (cols = EXPORT_COLUMNS.map((c) => c.key))}>Pilih semua</button>
									<button type="button" class="btn btn-ghost btn-sm" onclick={() => (cols = [])}>Kosongkan</button>
								</div>
							</div>
							<div class="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
								{#each EXPORT_COLUMNS as c}
									<label
										class="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition {cols.includes(c.key)
											? 'border-brand-200 bg-brand-50/60 text-slate-900'
											: 'border-slate-200 text-slate-600 hover:bg-slate-50'}"
									>
										<input type="checkbox" name="col" value={c.key} bind:group={cols} class="size-4 rounded accent-brand-600" />
										{c.label}
									</label>
								{/each}
							</div>
						</section>
					{/if}

					<!-- Format -->
					<section>
						<h3 class="label">Pemisah kolom</h3>
						<div class="grid gap-3 sm:grid-cols-2">
							{#each [['semicolon', 'Titik koma ( ; )', 'Excel dengan bahasa/regional Indonesia'], ['comma', 'Koma ( , )', 'Google Sheets, Excel bahasa Inggris']] as [val, lbl, desc]}
								<label
									class="flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition {sep === val
										? 'border-brand-500 bg-brand-50/50'
										: 'border-slate-200 hover:bg-slate-50'}"
								>
									<input type="radio" name="sep" value={val} bind:group={sep} class="mt-0.5 size-4 accent-brand-600" />
									<span>
										<span class="block text-sm font-medium">{lbl}</span>
										<span class="block text-xs text-slate-500">{desc}</span>
									</span>
								</label>
							{/each}
						</div>
					</section>
				</div>

				<!-- Footer -->
				<div class="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
					<Dialog.Close type="button" class="btn btn-secondary">Batal</Dialog.Close>
					<button class="btn btn-success" disabled={!canSubmit}><Download /> Download CSV</button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
