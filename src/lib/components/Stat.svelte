<script>
	import { TrendingUp, TrendingDown, Minus } from '@lucide/svelte';
	import { fmtNum } from '#lib/constants.js';
	let { label, value, prev = null, hint = '', accent = 'text-slate-900', icon: Icon = null, tone = 'brand' } = $props();
	const delta = $derived(prev === null ? null : prev === 0 ? (value > 0 ? 100 : 0) : Math.round(((value - prev) / prev) * 100));
	const TONES = {
		brand: 'bg-brand-50 text-brand-600',
		sky: 'bg-sky-50 text-sky-600',
		emerald: 'bg-emerald-50 text-emerald-600',
		amber: 'bg-amber-50 text-amber-600',
		rose: 'bg-rose-50 text-rose-600',
		violet: 'bg-violet-50 text-violet-600'
	};
</script>

<div class="card flex flex-col gap-3">
	<div class="flex items-start justify-between gap-2">
		<span class="text-sm font-medium text-slate-500">{label}</span>
		{#if Icon}
			<span class="flex size-9 items-center justify-center rounded-lg {TONES[tone]}"><Icon class="size-[18px]" /></span>
		{/if}
	</div>
	<div class="text-3xl font-semibold tracking-tight {accent}">{typeof value === 'number' ? fmtNum(value) : value}</div>
	<div class="flex items-center gap-1.5 text-xs text-slate-500">
		{#if delta !== null}
			<span
				class="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium {delta > 0
					? 'bg-emerald-50 text-emerald-700'
					: delta < 0
						? 'bg-rose-50 text-rose-700'
						: 'bg-slate-100 text-slate-600'}"
			>
				{#if delta > 0}<TrendingUp class="size-3" />{:else if delta < 0}<TrendingDown class="size-3" />{:else}<Minus class="size-3" />{/if}
				{Math.abs(delta)}%
			</span>
			<span>vs periode sebelumnya</span>
		{:else if hint}
			<span>{hint}</span>
		{/if}
	</div>
</div>
