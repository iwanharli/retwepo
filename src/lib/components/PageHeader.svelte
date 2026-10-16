<script>
	let { title, description = '', icon: Icon = null, actions = null } = $props();
</script>

<div class="mb-6 flex flex-wrap items-center justify-between gap-4 lg:mb-8">
	<div class="flex min-w-0 items-center gap-3.5">
		{#if Icon}
			<span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
				<Icon class="size-5" />
			</span>
		{/if}
		<div class="min-w-0">
			<h1 class="text-xl font-semibold tracking-tight text-slate-900 lg:text-2xl">{title}</h1>
			{#if description}<p class="mt-0.5 text-sm text-slate-500">{description}</p>{/if}
		</div>
	</div>
	{#if actions}<div class="flex flex-wrap items-center gap-2">{@render actions()}</div>{/if}
</div>
