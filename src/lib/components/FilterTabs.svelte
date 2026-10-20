<script>
	import { page } from '$app/state';
	import { fmtNum } from '#lib/constants.js';

	/**
	 * Tab status di bawah judul halaman — satu gaya untuk semua halaman.
	 * param: nama query string (mis. "status")
	 * items: [{ value, label, count?, icon?, alert? }]
	 *   value null = parameter dihapus (nilai default halaman); '' = diset kosong (mis. "Semua")
	 *   alert: 'amber' | 'rose' → angka diberi warna saat tab tidak aktif
	 * current: nilai yang sedang aktif
	 */
	let { param = 'status', items, current } = $props();

	function href(value) {
		const u = new URLSearchParams(page.url.search);
		u.delete('page');
		if (value === null) u.delete(param);
		else u.set(param, value);
		const q = u.toString();
		return q ? `?${q}` : page.url.pathname;
	}
	const ALERT = { amber: 'bg-amber-500 text-white', rose: 'bg-rose-100 text-rose-700' };
</script>

<nav class="mb-4 flex flex-wrap gap-1.5" aria-label="Status">
	{#each items as it (it.value ?? '__default')}
		{@const active = (current ?? null) === (it.value ?? null)}
		<a
			href={href(it.value)}
			aria-current={active ? 'page' : undefined}
			class="inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition {active
				? 'bg-slate-900 text-white shadow-sm'
				: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}"
		>
			{#if it.icon}<it.icon class="size-4" />{/if}{it.label}
			{#if it.count !== undefined}
				<span class="rounded-full px-1.5 text-xs {active ? 'bg-white/20' : it.alert && it.count ? ALERT[it.alert] : 'bg-slate-100 text-slate-500'}">{fmtNum(it.count)}</span>
			{/if}
		</a>
	{/each}
</nav>
