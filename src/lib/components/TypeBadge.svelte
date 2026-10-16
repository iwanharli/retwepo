<script>
	import { FileText, Reply } from '@lucide/svelte';
	let { type } = $props();
</script>

{#if type === 'post'}
	<span class="inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-brand-100"><FileText class="size-3" /> Postingan</span>
{:else}
	<span class="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-sky-100"><Reply class="size-3" /> Panel</span>
{/if}
