<script>
	let { cls = 'bg-slate-100 text-slate-700', dot = false, children } = $props();
</script>

<span class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium {cls}">
	{#if dot}<span class="size-1.5 rounded-full bg-current"></span>{/if}
	{@render children()}
</span>
