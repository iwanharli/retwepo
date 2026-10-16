<script>
	import { page } from '$app/state';
	import { ArrowUp, ArrowDown, ChevronsUpDown } from '@lucide/svelte';

	/**
	 * Judul kolom yang bisa diklik untuk mengurutkan.
	 * sort: { key, dir } urutan aktif; defaultDir: arah saat kolom pertama kali diklik
	 * onsort(key, dir): bila diisi, urutkan di sisi klien (tanpa mengubah URL)
	 */
	let { key, label, sort, defaultDir = 'asc', align = 'left', onsort = null, class: cls = '' } = $props();

	const active = $derived(sort?.key === key);
	const nextDir = $derived(active ? (sort.dir === 'asc' ? 'desc' : 'asc') : defaultDir);
	const href = $derived.by(() => {
		const u = new URLSearchParams(page.url.search);
		u.set('sort', key);
		u.set('dir', nextDir);
		u.delete('page');
		return '?' + u;
	});
	const linkCls = $derived(
		`group inline-flex items-center gap-1 transition select-none hover:text-slate-900 ${align === 'right' ? 'flex-row-reverse' : ''} ${active ? 'text-slate-900' : ''}`
	);
</script>

{#snippet inner()}
	<span>{label}</span>
	{#if active}
		{#if sort.dir === 'asc'}<ArrowUp class="size-3.5 text-brand-600" />{:else}<ArrowDown class="size-3.5 text-brand-600" />{/if}
	{:else}
		<ChevronsUpDown class="size-3.5 opacity-0 transition group-hover:opacity-60" />
	{/if}
{/snippet}

<th class="{cls} {align === 'right' ? 'text-right' : ''}" aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
	{#if onsort}
		<button type="button" class={linkCls} onclick={() => onsort(key, nextDir)} title="Urutkan berdasarkan {label}">{@render inner()}</button>
	{:else}
		<a {href} class={linkCls} data-sveltekit-noscroll title="Urutkan berdasarkan {label}">{@render inner()}</a>
	{/if}
</th>
