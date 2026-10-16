<script>
	let { icon: Icon, title, description = '', children = null } = $props();
</script>

<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
	<span class="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Icon class="size-6" /></span>
	<h3 class="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
	{#if description}<p class="mt-1 max-w-sm text-sm text-slate-500">{description}</p>{/if}
	{#if children}<div class="mt-5">{@render children()}</div>{/if}
</div>
