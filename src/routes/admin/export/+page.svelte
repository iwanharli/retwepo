<script>
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Download, FileSpreadsheet, ListChecks, Wallet, Megaphone, Users, AtSign, Hash, Layers, CalendarDays, SlidersHorizontal, Columns3, X, Info } from '@lucide/svelte';
	import {
		PLATFORMS,
		PLATFORM_KEYS,
		USER_STATUS,
		ACCOUNT_STATUS,
		EXPORT_COLUMNS,
		USER_EXPORT_COLUMNS,
		ACCOUNT_EXPORT_COLUMNS,
		fmtDate,
		fmtNum
	} from '#lib/constants.js';
	import PageHeader from '#lib/components/PageHeader.svelte';

	let { data } = $props();
	const pre = untrack(() => data.prefill);

	// ---- jenis data
	const TYPES = [
		{ key: 'detail', label: 'Detail rekap', desc: 'Satu baris per rekap, lengkap dengan URL & screenshot', icon: ListChecks, url: '/admin/export/recaps', mode: 'detail' },
		{ key: 'summary', label: 'Ringkasan pembayaran', desc: 'Total rekap per user + e-wallet', icon: Wallet, url: '/admin/export/recaps', mode: 'summary' },
		{ key: 'summary_campaign', label: 'Ringkasan per kampanye', desc: 'Total per user, dipisah tiap kampanye', icon: Megaphone, url: '/admin/export/recaps', mode: 'summary_campaign' },
		{ key: 'users', label: 'Data user', desc: 'Profil, e-wallet & jumlah rekap tiap user', icon: Users, url: '/admin/export/users' },
		{ key: 'accounts', label: 'Akun sosmed', desc: 'Akun, pemilik & jumlah rekap tiap akun', icon: AtSign, url: '/admin/export/accounts' }
	];
	let type = $state(TYPES.some((t) => t.key === pre.type) ? pre.type : 'summary');
	const T = $derived(TYPES.find((t) => t.key === type));
	const isRecap = $derived(T.url === '/admin/export/recaps');

	// ---- kampanye, tanggal, filter
	let campaign = $state(pre.campaign);
	let from = $state(pre.from);
	let to = $state(pre.to);
	let platform = $state(pre.platform);
	let rtype = $state(pre.rtype);
	let sep = $state('semicolon');
	let verifiedOwners = $state(true);
	let userStatuses = $state(pre.status.length && pre.type === 'users' ? pre.status : ['approved']);
	let accountStatuses = $state(pre.status.length && pre.type === 'accounts' ? pre.status : ['approved']);
	// filter yang terbawa dari halaman asal (bisa dihapus)
	let carried = $state(Object.fromEntries(['q', 'user', 'account', 'evidence'].map((k) => [k, pre[k]]).filter(([, v]) => v)));

	// ---- kolom per jenis
	const COLS = { detail: EXPORT_COLUMNS, users: USER_EXPORT_COLUMNS, accounts: ACCOUNT_EXPORT_COLUMNS };
	const defaults = (list) => list.filter((c) => c.default).map((c) => c.key);
	let cols = $state({ detail: defaults(EXPORT_COLUMNS), users: defaults(USER_EXPORT_COLUMNS), accounts: defaults(ACCOUNT_EXPORT_COLUMNS) });
	const colList = $derived(COLS[type] ?? null);

	// ---- tanggal
	const ymd = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
	const today = ymd(new Date());
	function setRange(kind) {
		if (kind === 'all') return ((from = ''), (to = ''));
		if (kind === 'month') return ((from = today.slice(0, 8) + '01'), (to = today));
		if (kind === 'lastmonth') {
			const first = new Date(`${today.slice(0, 8)}01T00:00:00+07:00`);
			const end = new Date(first.getTime() - 86400000);
			return ((from = ymd(end).slice(0, 8) + '01'), (to = ymd(end)));
		}
		to = today;
		from = ymd(new Date(Date.now() - (kind - 1) * 86400000));
	}
	const RANGES = [['month', 'Bulan ini'], ['lastmonth', 'Bulan lalu'], [7, '7 hari'], [30, '30 hari'], [90, '90 hari'], ['all', 'Semua waktu']];
	const rangeText = $derived(from || to ? `${from ? fmtDate(from) : 'awal'} – ${to ? fmtDate(to) : 'sekarang'}` : 'Semua waktu');
	const campaignName = $derived(data.campaigns.find((c) => String(c.id) === String(campaign))?.name);

	const statusError = $derived((type === 'users' && !userStatuses.length) || (type === 'accounts' && !accountStatuses.length));
	const canSubmit = $derived(!statusError && (!colList || cols[type].length > 0));
	const CARRY_LABEL = { q: 'Cari', user: 'User #', account: 'Akun #', evidence: 'Bukti' };

	const chip = (on) =>
		`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${on ? 'border-brand-200 bg-brand-50/60 text-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`;
</script>

<svelte:head><title>Export Data · Admin Retwepo</title></svelte:head>

<PageHeader title="Export Data" description="Unduh data rekap, pembayaran, user, atau akun sosmed ke CSV — bisa per kampanye." icon={FileSpreadsheet} />

<form method="GET" action={T.url} data-sveltekit-reload class="space-y-6">
	{#if T.mode}<input type="hidden" name="mode" value={T.mode} />{/if}

	<!-- 1. jenis data -->
	<section class="card p-0">
		<div class="card-header"><div class="card-title">1. Data yang diekspor</div></div>
		<div class="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
			{#each TYPES as t (t.key)}
				{@const on = type === t.key}
				<label class="flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition {on ? 'border-brand-500 bg-brand-50/50 ring-4 ring-brand-500/10' : 'border-slate-200 hover:bg-slate-50'}">
					<input type="radio" value={t.key} bind:group={type} class="sr-only" />
					<span class="flex size-9 items-center justify-center rounded-lg {on ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}"><t.icon class="size-[18px]" /></span>
					<span class="text-sm font-semibold text-slate-900">{t.label}</span>
					<span class="text-xs leading-snug text-slate-500">{t.desc}</span>
				</label>
			{/each}
		</div>
	</section>

	<!-- 2. kampanye -->
	<section class="card p-0">
		<div class="card-header">
			<div class="card-title">2. Kampanye</div>
			<span class="text-xs text-slate-500">{isRecap ? 'rekap yang diekspor' : 'jumlah rekap yang dihitung'}</span>
		</div>
		<div class="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
			{#each [{ id: '', name: null, total: data.counts.recaps, month: null, active: true }, ...data.campaigns] as c (c.id)}
				{@const on = String(campaign) === String(c.id)}
				<label class="flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition {on ? 'border-violet-500 bg-violet-50/60 ring-4 ring-violet-500/10' : 'border-slate-200 hover:bg-slate-50'}">
					<input type="radio" name="campaign" value={c.id} bind:group={campaign} class="sr-only" />
					<span class="flex size-10 shrink-0 items-center justify-center rounded-xl {on ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-600'}">
						{#if c.name}<Hash class="size-5" />{:else}<Layers class="size-5" />{/if}
					</span>
					<span class="min-w-0">
						<span class="block font-semibold break-all text-slate-900">{c.name ? `#${c.name}` : 'Semua kampanye'}</span>
						<span class="block text-xs text-slate-500">{fmtNum(c.total)} rekap{#if c.name && !c.active} · ditutup{/if}</span>
					</span>
				</label>
			{/each}
		</div>
		{#if type === 'summary_campaign' && campaign}
			<p class="mx-5 mb-5 -mt-1 flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-800"><Info class="size-3.5" /> Hanya #{campaignName} yang diekspor. Pilih "Semua kampanye" untuk mendapat semua kampanye dalam satu file, dipisah per baris.</p>
		{/if}
	</section>

	<div class="grid gap-6 xl:grid-cols-2">
		<!-- 3. tanggal -->
		<section class="card p-0">
			<div class="card-header"><div class="card-title"><CalendarDays /> 3. Rentang tanggal</div></div>
			<div class="space-y-3 p-5">
				<div class="flex flex-wrap gap-1.5">
					{#each RANGES as [k, lbl]}
						<button type="button" class="inline-flex h-8 items-center rounded-full bg-slate-100 px-3.5 text-xs font-medium text-slate-600 hover:bg-slate-200" onclick={() => setRange(k)}>{lbl}</button>
					{/each}
				</div>
				<div class="flex items-center gap-2">
					<input class="input" type="date" name="from" bind:value={from} aria-label="Dari tanggal" />
					<span class="text-slate-400">–</span>
					<input class="input" type="date" name="to" bind:value={to} aria-label="Sampai tanggal" />
				</div>
				<p class="hint">Dipilih: <b class="text-slate-700">{rangeText}</b>{isRecap ? ' · berdasarkan waktu posting' : ' · untuk menghitung jumlah rekap'}</p>
			</div>
		</section>

		<!-- 4. filter -->
		<section class="card p-0">
			<div class="card-header"><div class="card-title"><SlidersHorizontal /> 4. Filter</div></div>
			<div class="space-y-4 p-5">
				{#if type !== 'users'}
					<div class="grid gap-3 sm:grid-cols-2">
						<select class="input" name="platform" bind:value={platform}>
							<option value="">Semua platform</option>
							{#each PLATFORM_KEYS as k}<option value={k}>{PLATFORMS[k].label}</option>{/each}
						</select>
						{#if isRecap}
							<select class="input" name="type" bind:value={rtype}>
								<option value="">Postingan & panel</option>
								<option value="post">Postingan saja</option>
								<option value="reply">Panel saja</option>
							</select>
						{/if}
					</div>
				{/if}
				{#if type === 'users'}
					<div>
						<span class="label">Status user</span>
						<div class="flex flex-wrap gap-2">
							{#each Object.entries(USER_STATUS) as [v, s]}
								<label class={chip(userStatuses.includes(v))}><input type="checkbox" name="status" value={v} bind:group={userStatuses} class="size-4 accent-brand-600" />{s.label}</label>
							{/each}
						</div>
					</div>
				{/if}
				{#if type === 'accounts'}
					<div>
						<span class="label">Status akun</span>
						<div class="flex flex-wrap gap-2">
							{#each Object.entries(ACCOUNT_STATUS) as [v, s]}
								<label class={chip(accountStatuses.includes(v))}><input type="checkbox" name="status" value={v} bind:group={accountStatuses} class="size-4 accent-brand-600" />{s.label}</label>
							{/each}
						</div>
					</div>
					<label class="flex cursor-pointer items-center gap-2.5 text-sm"><input type="checkbox" name="owner" value="verified" bind:checked={verifiedOwners} class="size-4 accent-brand-600" /> Hanya akun milik user terverifikasi</label>
				{/if}
				{#if Object.keys(carried).length}
					<div>
						<span class="label">Dari halaman sebelumnya</span>
						<div class="flex flex-wrap gap-2">
							{#each Object.entries(carried) as [k, v] (k)}
								<input type="hidden" name={k} value={v} />
								<button type="button" class="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-50 pr-2 pl-3 text-xs font-medium text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100" onclick={() => delete carried[k]}>
									{CARRY_LABEL[k]}{k === 'q' ? `: "${v}"` : k === 'evidence' ? `: ${v}` : v}<X class="size-3.5 opacity-60" />
								</button>
							{/each}
						</div>
					</div>
				{/if}
				{#if type === 'users'}<p class="hint">Data user tidak difilter per platform.</p>{/if}
			</div>
		</section>
	</div>

	<!-- 5. kolom -->
	{#if colList}
		<section class="card p-0">
			<div class="card-header">
				<div class="card-title"><Columns3 /> 5. Kolom ({cols[type].length})</div>
				<div class="flex gap-1">
					<button type="button" class="btn btn-ghost btn-sm" onclick={() => (cols[type] = colList.map((c) => c.key))}>Pilih semua</button>
					<button type="button" class="btn btn-ghost btn-sm" onclick={() => (cols[type] = [])}>Kosongkan</button>
				</div>
			</div>
			<div class="grid gap-2 p-5 sm:grid-cols-2 lg:grid-cols-4">
				{#each colList as c (c.key)}
					<label class={chip(cols[type].includes(c.key))}><input type="checkbox" name="col" value={c.key} bind:group={cols[type]} class="size-4 accent-brand-600" />{c.label}</label>
				{/each}
			</div>
		</section>
	{/if}

	<!-- format -->
	<section class="card p-0">
		<div class="card-header"><div class="card-title">Pemisah kolom</div></div>
		<div class="grid gap-3 p-5 sm:grid-cols-2">
			{#each [['semicolon', 'Titik koma ( ; )', 'Excel dengan bahasa/regional Indonesia'], ['comma', 'Koma ( , )', 'Google Sheets, Excel bahasa Inggris']] as [val, lbl, desc]}
				<label class="flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition {sep === val ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 hover:bg-slate-50'}">
					<input type="radio" name="sep" value={val} bind:group={sep} class="mt-0.5 size-4 accent-brand-600" />
					<span><span class="block text-sm font-medium">{lbl}</span><span class="block text-xs text-slate-500">{desc}</span></span>
				</label>
			{/each}
		</div>
	</section>

	<!-- ringkasan & tombol unduh, menempel di bawah layar -->
	<div class="sticky bottom-4 z-20 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xl shadow-slate-900/10">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<p class="min-w-0 text-sm text-slate-600">
				<b class="text-slate-900">{T.label}</b> · <span class="text-violet-700">{campaignName ? `#${campaignName}` : 'Semua kampanye'}</span> · {rangeText}{platform && type !== 'users' ? ` · ${PLATFORMS[platform].label}` : ''}
				{#if statusError}<span class="block text-xs text-rose-600">Pilih minimal satu status.</span>{:else if colList && !cols[type].length}<span class="block text-xs text-rose-600">Pilih minimal satu kolom.</span>{/if}
			</p>
			<button class="btn btn-success btn-lg" disabled={!canSubmit}><Download /> Download CSV</button>
		</div>
	</div>
</form>
