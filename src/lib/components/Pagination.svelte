<script>
	import { page } from '$app/state';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { fmtNum } from '#lib/constants.js';
	let { current, total, perPage } = $props();
	const pages = $derived(Math.max(1, Math.ceil(total / perPage)));

	function href(n) {
		const u = new URL(page.url);
		u.searchParams.set('page', String(n));
		return u.pathname + u.search;
	}
</script>

{#if total > 0}
	<nav class="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
		<span class="text-slate-500">
			Menampilkan <b class="text-slate-700">{fmtNum((current - 1) * perPage + 1)}–{fmtNum(Math.min(current * perPage, total))}</b>
			dari <b class="text-slate-700">{fmtNum(total)}</b>
		</span>
		{#if pages > 1}
			<div class="flex items-center gap-1.5">
				<a class="btn btn-secondary btn-sm {current <= 1 ? 'pointer-events-none opacity-40' : ''}" href={href(current - 1)}><ChevronLeft /> Sebelumnya</a>
				<span class="px-2 text-slate-500">{current} / {pages}</span>
				<a class="btn btn-secondary btn-sm {current >= pages ? 'pointer-events-none opacity-40' : ''}" href={href(current + 1)}>Berikutnya <ChevronRight /></a>
			</div>
		{/if}
	</nav>
{/if}
