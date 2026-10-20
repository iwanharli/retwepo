<script>
	import { Hash } from '@lucide/svelte';
	let { name } = $props();
</script>

{#if name}
	<span class="inline-flex max-w-full items-center gap-0.5 truncate rounded-md bg-violet-50 px-1.5 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-violet-100" title="Kelompok kampanye"
		><Hash class="size-3 shrink-0" />{name}</span
	>
{/if}
