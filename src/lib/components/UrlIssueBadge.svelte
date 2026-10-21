<script>
	import { TriangleAlert, CircleAlert } from '@lucide/svelte';
	import { checkRecapUrl } from '#lib/constants.js';
	/** Tanda link rekap yang rusak / tidak cocok dengan akunnya (pesan lengkap di tooltip) */
	/** full: kotak penjelasan (halaman detail); selain itu hanya ikon dengan tooltip */
	let { url, platform, username, full = false } = $props();
	const res = $derived(url ? checkRecapUrl(url, { platform, username }) : {});
</script>

{#if res.error || res.warning}
	{@const err = Boolean(res.error)}
	{#if full}
		<p class="mt-1.5 flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-xs {err ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'}">
			{#if err}<CircleAlert class="mt-px size-3.5 shrink-0" />{:else}<TriangleAlert class="mt-px size-3.5 shrink-0" />{/if}{res.error ?? res.warning}
		</p>
	{:else}
		<span class="inline-flex shrink-0 {err ? 'text-rose-500' : 'text-amber-500'}" title={res.error ?? res.warning} aria-label={res.error ?? res.warning}>
			{#if err}<CircleAlert class="size-3.5" />{:else}<TriangleAlert class="size-3.5" />{/if}
		</span>
	{/if}
{/if}
