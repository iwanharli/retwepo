<script>
	import { fade } from 'svelte/transition';
	/** route: id rute tujuan (mis. "/admin/recaps/[id]") → bentuk kerangka yang sesuai halamannya */
	let { route } = $props();

	const kind = $derived.by(() => {
		const r = route ?? '';
		if (r === '/admin') return 'stats';
		if (r === '/app') return 'dashboard';
		if (/\/recaps\/\[id\]\/edit$|\/recaps\/new$/.test(r)) return 'recapForm';
		if (/\/recaps\/\[id\]$/.test(r)) return 'recapDetail';
		if (/\/recaps$/.test(r)) return 'recapGrid';
		if (/\/admin\/(users|members)\/\[id\]$/.test(r)) return 'userDetail';
		if (r === '/admin/social/[id]') return 'accountDetail';
		if (r === '/admin/social') return 'groups';
		if (['/admin/members', '/admin/users', '/admin/accounts'].includes(r)) return 'table';
		if (r === '/admin/campaigns') return 'campaigns';
		if (r === '/admin/export') return 'export';
		if (r === '/admin/logs' || r === '/app/notifications') return 'timeline';
		if (r === '/admin/announcements') return 'announce';
		if (r === '/app/accounts') return 'accounts';
		if (r === '/app/profile') return 'profile';
		return 'generic';
	});
	const n = (k) => Array.from({ length: k }, (_, i) => i);
</script>

{#snippet header(tabs = 0, action = true)}
	<div class="mb-6 flex flex-wrap items-end justify-between gap-4">
		<div class="flex items-center gap-3">
			<div class="sk size-11 rounded-xl"></div>
			<div class="space-y-2"><div class="sk h-6 w-48"></div><div class="sk h-3.5 w-72 max-w-[60vw]"></div></div>
		</div>
		{#if action}<div class="sk h-9 w-32"></div>{/if}
	</div>
	{#if tabs}<div class="mb-4 flex gap-1.5">{#each n(tabs) as _}<div class="sk h-9 w-28 rounded-full"></div>{/each}</div>{/if}
{/snippet}
{#snippet filterBar(search = true)}
	<div class="mb-5 flex items-center gap-2">
		{#if search}<div class="sk h-9 w-80 max-w-full"></div>{/if}
		<div class="sk h-9 w-24"></div><div class="sk h-5 w-20 rounded-full"></div>
	</div>
{/snippet}
{#snippet stat()}
	<div class="card space-y-3"><div class="flex justify-between"><div class="space-y-1.5"><div class="sk h-3.5 w-24"></div><div class="sk h-3 w-36"></div></div><div class="sk size-9"></div></div><div class="sk h-8 w-20"></div><div class="sk h-3 w-32"></div></div>
{/snippet}
{#snippet chart(h = 'h-72')}
	<div class="card p-0"><div class="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><div class="sk size-9"></div><div class="space-y-1.5"><div class="sk h-3.5 w-40"></div><div class="sk h-3 w-56"></div></div></div>
		<div class="flex {h} items-end gap-2 p-5">{#each n(18) as i}<div class="sk flex-1 rounded-md" style="height:{25 + ((i * 37) % 70)}%"></div>{/each}</div></div>
{/snippet}
{#snippet recapCard()}
	<div class="overflow-hidden rounded-xl border border-slate-200/80 bg-white"><div class="sk aspect-[16/10] rounded-none"></div>
		<div class="space-y-3 p-4"><div class="flex items-center gap-3"><div class="sk size-9 rounded-full"></div><div class="flex-1 space-y-1.5"><div class="sk h-3.5 w-3/4"></div><div class="sk h-3 w-1/2"></div></div></div><div class="sk h-8 w-full"></div>
			<div class="flex items-center justify-between border-t border-slate-100 pt-3"><div class="sk h-3 w-24"></div><div class="sk h-8 w-20"></div></div></div></div>
{/snippet}
{#snippet tableRows(rows = 8, cols = 5)}
	<div class="card p-0"><div class="flex gap-6 border-b border-slate-100 px-5 py-3.5">{#each n(cols) as _}<div class="sk h-3 flex-1"></div>{/each}</div>
		{#each n(rows) as _}<div class="flex items-center gap-6 border-b border-slate-50 px-5 py-3.5 last:border-0"><div class="flex flex-1 items-center gap-3"><div class="sk size-9 rounded-full"></div><div class="flex-1 space-y-1.5"><div class="sk h-3.5 w-2/3"></div><div class="sk h-3 w-1/2"></div></div></div>{#each n(cols - 2) as _}<div class="sk h-3.5 flex-1"></div>{/each}<div class="sk h-8 w-24"></div></div>{/each}</div>
{/snippet}
{#snippet profileHead()}
	<div class="mb-6 flex flex-wrap items-center gap-4"><div class="sk size-16 rounded-2xl"></div><div class="flex-1 space-y-2"><div class="sk h-7 w-56"></div><div class="sk h-3.5 w-72 max-w-full"></div><div class="sk h-3.5 w-40"></div></div><div class="sk h-9 w-28"></div><div class="sk h-9 w-28"></div></div>
{/snippet}

<div in:fade={{ duration: 150 }} aria-busy="true" aria-label="Memuat halaman">
	{#if kind === 'stats'}
		<div class="mb-6 space-y-2"><div class="sk h-7 w-36"></div><div class="sk h-3.5 w-60"></div></div>
		{@render filterBar(false)}
		<div class="sk mb-6 h-12 w-full rounded-xl"></div>
		<div class="grid grid-cols-2 gap-4 lg:grid-cols-4"><div class="sk col-span-2 h-44 rounded-2xl"></div>{@render stat()}{@render stat()}</div>
		<div class="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4"><div class="sk col-span-2 h-40 rounded-2xl"></div>{@render stat()}{@render stat()}</div>
		<div class="mt-6">{@render chart()}</div>
	{:else if kind === 'dashboard'}
		<div class="sk mb-6 h-40 rounded-2xl lg:mb-8"></div>
		{@render filterBar(false)}
		<div class="grid grid-cols-2 gap-4 lg:gap-6 xl:grid-cols-4"><div class="sk col-span-2 h-44 rounded-2xl xl:col-span-1"></div>{@render stat()}{@render stat()}{@render stat()}</div>
		<div class="mt-6 grid gap-6 xl:grid-cols-3"><div class="xl:col-span-2">{@render chart()}</div><div class="card flex flex-col items-center justify-center gap-4"><div class="sk size-44 rounded-full"></div><div class="grid w-full grid-cols-2 gap-3"><div class="sk h-14"></div><div class="sk h-14"></div></div></div></div>
	{:else if kind === 'recapGrid'}
		{@render header(2)}
		{@render filterBar()}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 2xl:grid-cols-4">{#each n(8) as _}{@render recapCard()}{/each}</div>
	{:else if kind === 'recapDetail'}
		<div class="sk mb-4 h-4 w-32"></div>
		<div class="grid gap-6 xl:grid-cols-5"><div class="sk aspect-[4/3] rounded-2xl xl:col-span-3"></div>
			<div class="space-y-6 xl:col-span-2"><div class="card space-y-4"><div class="flex items-center gap-3"><div class="sk size-11 rounded-full"></div><div class="flex-1 space-y-2"><div class="sk h-4 w-2/3"></div><div class="sk h-3 w-1/3"></div></div></div>{#each n(5) as _}<div class="flex gap-3"><div class="sk h-3.5 w-28"></div><div class="sk h-3.5 flex-1"></div></div>{/each}</div><div class="card space-y-3"><div class="sk h-4 w-32"></div><div class="flex items-center gap-3"><div class="sk size-11 rounded-full"></div><div class="flex-1 space-y-2"><div class="sk h-3.5 w-1/2"></div><div class="sk h-3 w-2/3"></div></div></div></div></div></div>
	{:else if kind === 'recapForm'}
		{@render header(0, false)}
		<div class="grid gap-6 xl:grid-cols-5"><div class="space-y-6 xl:col-span-3"><div class="card space-y-4"><div class="sk h-4 w-28"></div><div class="grid gap-3 sm:grid-cols-2">{#each n(4) as _}<div class="sk h-16 rounded-xl"></div>{/each}</div></div><div class="card space-y-5">{#each n(4) as _}<div class="space-y-2"><div class="sk h-3.5 w-28"></div><div class="sk h-10 w-full"></div></div>{/each}</div></div>
			<div class="space-y-6 xl:col-span-2"><div class="card space-y-4"><div class="sk h-4 w-28"></div><div class="sk aspect-[4/3] rounded-xl"></div></div><div class="sk h-12 w-full rounded-xl"></div></div></div>
	{:else if kind === 'userDetail' || kind === 'accountDetail'}
		<div class="sk mb-4 h-4 w-32"></div>
		{@render profileHead()}
		{#if kind === 'userDetail'}<div class="mb-6 grid gap-4 md:grid-cols-3">{#each n(3) as _}<div class="sk h-20 rounded-xl"></div>{/each}</div>{/if}
		<div class="sk mb-3 h-5 w-28"></div>
		{@render filterBar(false)}
		<div class="grid grid-cols-2 gap-4 lg:grid-cols-5">{#each n(5) as _}{@render stat()}{/each}</div>
		<div class="mt-6">{@render chart('h-60')}</div>
	{:else if kind === 'groups'}
		{@render header(3)}
		{@render filterBar()}
		<div class="space-y-3">{#each n(7) as _}<div class="card flex flex-wrap items-center gap-5 py-4"><div class="sk size-5"></div><div class="sk size-10 rounded-full"></div><div class="min-w-40 flex-1 space-y-1.5"><div class="sk h-4 w-40"></div><div class="sk h-3 w-52"></div></div><div class="flex -space-x-1.5">{#each n(4) as _}<div class="sk size-7 rounded-full ring-2 ring-white"></div>{/each}</div>{#each n(4) as _}<div class="space-y-1.5"><div class="sk h-3 w-12"></div><div class="sk h-4 w-10"></div></div>{/each}<div class="sk h-8 w-28"></div></div>{/each}</div>
	{:else if kind === 'table'}
		{@render header(3)}
		{@render filterBar()}
		{@render tableRows(9, 6)}
	{:else if kind === 'campaigns'}
		{@render header(0, false)}
		<div class="card mb-6 flex items-end gap-3"><div class="flex-1 space-y-2"><div class="sk h-3.5 w-32"></div><div class="sk h-10 w-full"></div></div><div class="sk h-10 w-40"></div></div>
		<div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{#each n(3) as _}<div class="card space-y-4"><div class="flex items-center gap-3"><div class="sk size-11 rounded-xl"></div><div class="space-y-1.5"><div class="sk h-5 w-40"></div><div class="sk h-3 w-24"></div></div></div><div class="sk h-16 w-full rounded-xl"></div><div class="flex justify-end gap-1.5">{#each n(3) as _}<div class="sk h-8 w-24"></div>{/each}</div></div>{/each}</div>
	{:else if kind === 'export'}
		{@render header(0, false)}
		<div class="space-y-6"><div class="card"><div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{#each n(5) as _}<div class="sk h-32 rounded-xl"></div>{/each}</div></div><div class="card"><div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{#each n(3) as _}<div class="sk h-20 rounded-xl"></div>{/each}</div></div><div class="grid gap-6 xl:grid-cols-2"><div class="sk h-44 rounded-2xl"></div><div class="sk h-44 rounded-2xl"></div></div></div>
	{:else if kind === 'timeline'}
		{@render header(route === '/app/notifications' ? 2 : 0)}
		{@render filterBar(route !== '/app/notifications')}
		<div class="card p-0">{#each n(8) as _}<div class="flex gap-4 border-b border-slate-50 px-5 py-4 last:border-0"><div class="sk size-9 shrink-0 rounded-full"></div><div class="flex-1 space-y-2"><div class="flex justify-between gap-4"><div class="sk h-3.5 w-2/3"></div><div class="sk h-3 w-24"></div></div><div class="sk h-3 w-1/2"></div></div></div>{/each}</div>
	{:else if kind === 'announce'}
		{@render header(0, false)}
		<div class="grid gap-6 xl:grid-cols-5"><div class="card space-y-5 xl:col-span-3">{#each n(3) as _}<div class="space-y-2"><div class="sk h-3.5 w-24"></div><div class="sk h-10 w-full"></div></div>{/each}<div class="sk h-20 w-full rounded-xl"></div></div><div class="card space-y-4 xl:col-span-2">{#each n(4) as _}<div class="space-y-2"><div class="sk h-4 w-3/4"></div><div class="sk h-3 w-1/2"></div><div class="sk h-1.5 w-full"></div></div>{/each}</div></div>
	{:else if kind === 'accounts'}
		{@render header(0)}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{#each n(6) as _}<div class="card flex items-center gap-3"><div class="sk size-11 rounded-xl"></div><div class="flex-1 space-y-2"><div class="sk h-4 w-2/3"></div><div class="sk h-3 w-1/3"></div></div><div class="sk h-6 w-20 rounded-full"></div></div>{/each}</div>
	{:else if kind === 'profile'}
		{@render header(0, false)}
		<div class="grid gap-6 xl:grid-cols-3"><div class="card flex flex-col items-center gap-3 py-8"><div class="sk size-20 rounded-full"></div><div class="sk h-5 w-40"></div><div class="sk h-3.5 w-52"></div></div><div class="card space-y-5 xl:col-span-2">{#each n(4) as _}<div class="space-y-2"><div class="sk h-3.5 w-28"></div><div class="sk h-10 w-full"></div></div>{/each}<div class="sk h-10 w-36"></div></div></div>
	{:else}
		{@render header(0)}
		<div class="card space-y-4">{#each n(6) as _}<div class="sk h-4 w-full"></div>{/each}</div>
	{/if}
</div>
