<script>
	import { Copy } from '@lucide/svelte';
	/** count: jumlah rekap aktif lain dengan URL yang sama */
	let { count } = $props();
</script>

{#if count > 0}
	<span
		class="inline-flex items-center gap-1 rounded-md bg-orange-50 px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-orange-700 ring-1 ring-orange-200"
		title="URL ini juga ada di {count} rekap lain"
	>
		<Copy class="size-3" /> Duplikat ×{count + 1}
	</span>
{/if}
