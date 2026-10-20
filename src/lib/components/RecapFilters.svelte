<script>
	import { page } from '$app/state';
	import { Search, FunnelX, SlidersHorizontal, CalendarDays, UserRound, X } from '@lucide/svelte';
	import { PLATFORMS, PLATFORM_KEYS } from '#lib/constants.js';
	import ExportDialog from './ExportDialog.svelte';
	import PlatformIcon from './PlatformIcon.svelte';
	/** presets: pilihan cepat rentang tanggal, mis. [[7, '7 hari'], [30, '30 hari'], [null, 'Semua']] */
	/** filterUser: user yang sedang difilter lewat ?user= (admin), tampil sebagai chip; placeholder: teks kotak cari */
	/** campaigns: daftar kampanye untuk filter */
	/** filterAccount: akun sosmed yang difilter lewat ?account= (admin), tampil sebagai chip */
	let { f, campaigns = [], accounts = null, filterUser = null, filterAccount = null, exportable = false, view = null, presets = null, placeholder = 'Cari URL, catatan, username…' } = $props();

	function withoutUser(key = 'user') {
		const u = new URLSearchParams(page.url.search);
		u.delete(key);
		u.delete('page');
		return '?' + u.toString();
	}

	// jumlah filter yang diisi user sendiri (bukan nilai default)
	const active = $derived([...page.url.searchParams].filter(([k, v]) => !['view', 'page', 'sort', 'dir'].includes(k) && v).length);

	const ymd = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
	function presetHref(days) {
		const u = new URLSearchParams(page.url.search);
		u.delete('page');
		if (days) {
			u.set('from', ymd(new Date(Date.now() - (days - 1) * 86400000)));
			u.set('to', ymd(new Date()));
		} else {
			u.set('from', '');
			u.set('to', '');
		}
		return '?' + u.toString();
	}
	function presetActive(days) {
		if (!days) return !f.from && !f.to;
		return f.to === ymd(new Date()) && f.from === ymd(new Date(Date.now() - (days - 1) * 86400000));
	}
</script>

<form method="GET" class="card mb-6 p-4 lg:p-5">
	{#if presets || filterUser || filterAccount || exportable}
		<div class="mb-4 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
			{#if presets}
				<CalendarDays class="size-4 text-slate-400" />
				{#each presets as [days, lbl]}
					<a
						href={presetHref(days)}
						class="inline-flex h-7 items-center rounded-full px-3 text-xs font-medium transition {presetActive(days)
							? 'bg-slate-900 text-white'
							: 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">{lbl}</a
					>
				{/each}
			{/if}
			{#if filterUser}
				<span class="mx-1 hidden h-5 w-px bg-slate-200 sm:block"></span>
				<a
					href={withoutUser()}
					class="inline-flex h-7 items-center gap-1.5 rounded-full bg-brand-50 pr-2 pl-2.5 text-xs font-medium text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100"
					title="Hapus filter user"
				>
					<UserRound class="size-3.5" />{filterUser.nickname ?? filterUser.email}<X class="size-3.5 opacity-60" />
				</a>
			{/if}
			{#if filterAccount}
				<span class="mx-1 hidden h-5 w-px bg-slate-200 sm:block"></span>
				<a
					href={withoutUser('account')}
					class="inline-flex h-7 items-center gap-1.5 rounded-full bg-brand-50 pr-2 pl-1.5 text-xs font-medium text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100"
					title="Hapus filter akun"
				>
					<PlatformIcon platform={filterAccount.platform} size={18} class="rounded-full" />@{filterAccount.username}<X class="size-3.5 opacity-60" />
				</a>
			{/if}
			{#if exportable}<ExportDialog {f} {campaigns} />{/if}
		</div>
	{/if}
	{#if view}<input type="hidden" name="view" value={view} />{/if}
	<!-- pertahankan urutan kolom tabel saat menerapkan filter -->
	{#if page.url.searchParams.get('sort')}<input type="hidden" name="sort" value={page.url.searchParams.get('sort')} />{/if}
	{#if page.url.searchParams.get('dir')}<input type="hidden" name="dir" value={page.url.searchParams.get('dir')} />{/if}
	{#if filterUser}<input type="hidden" name="user" value={filterUser.id} />{/if}
	{#if filterAccount}<input type="hidden" name="account" value={filterAccount.id} />{/if}

	<!-- Grid 12 kolom: cari (4) + 4 dropdown (2 × 4); tanggal (6) + tombol (6) -->
	<div class="grid grid-cols-2 gap-3 md:grid-cols-6 xl:grid-cols-12">
		<div class="relative col-span-2 md:col-span-6 xl:col-span-4">
			<Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
			<input class="input pl-9" name="q" value={f.q} {placeholder} aria-label="Cari" />
		</div>
		{#if accounts}
			<select class="input col-span-2 md:col-span-2" name="account" value={f.account ?? ''} aria-label="Akun">
				<option value="">Semua akun</option>
				{#each accounts as a}<option value={a.id}>{PLATFORMS[a.platform].label} · @{a.username}</option>{/each}
			</select>
		{:else}
			<select class="input col-span-2 md:col-span-2" name="platform" value={f.platform ?? ''} aria-label="Platform">
				<option value="">Semua platform</option>
				{#each PLATFORM_KEYS as k}<option value={k}>{PLATFORMS[k].label}</option>{/each}
			</select>
		{/if}
		<select class="input md:col-span-2" name="campaign" value={f.campaign ?? ''} aria-label="Kampanye">
			<option value="">Semua kampanye</option>
			{#each campaigns as c (c.id)}<option value={c.id}>#{c.name}</option>{/each}
		</select>
		<select class="input md:col-span-2" name="type" value={f.type ?? ''} aria-label="Tipe">
			<option value="">Semua tipe</option>
			<option value="post">Postingan</option>
			<option value="reply">Panel</option>
		</select>
		<select class="input md:col-span-2" name="evidence" value={f.evidence ?? ''} aria-label="Bukti">
			<option value="">Semua bukti</option>
			<option value="url">Ada URL</option>
			<option value="shot">Ada screenshot</option>
			<option value="dup">URL duplikat</option>
		</select>

		<div class="col-span-2 flex items-center gap-2 md:col-span-6 xl:col-span-6">
			<input class="input min-w-0 flex-1" type="date" name="from" value={f.from ?? ''} aria-label="Dari tanggal" />
			<span class="shrink-0 text-slate-400">–</span>
			<input class="input min-w-0 flex-1" type="date" name="to" value={f.to ?? ''} aria-label="Sampai tanggal" />
		</div>
		<div class="col-span-2 flex items-center justify-end gap-2 md:col-span-6 xl:col-span-6">
			{#if active}
				<a href="?{view ? `view=${view}` : ''}" class="btn btn-ghost h-10"><FunnelX /> Reset <span class="rounded-full bg-slate-200 px-1.5 text-xs">{active}</span></a>
			{/if}
			<button class="btn btn-primary h-10 flex-1 md:flex-none xl:min-w-36"><SlidersHorizontal /> Terapkan</button>
		</div>
	</div>
</form>
