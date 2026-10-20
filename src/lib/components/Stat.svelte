<script>
	import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from '@lucide/svelte';
	import { fmtNum } from '#lib/constants.js';
	/** desc: penjelasan singkat di bawah judul; href: kartu bisa diklik ke halaman rincian */
	let { label, desc = '', href = null, value, prev = null, hint = '', accent = 'text-slate-900', icon: Icon = null, tone = 'brand' } = $props();
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

<svelte:element
	this={href ? 'a' : 'div'}
	{href}
	class="card group relative flex h-full flex-col gap-3 {href ? 'transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md' : ''}"
>
	<div class="flex items-start justify-between gap-2">
		<div class="min-w-0">
			<span class="block text-sm font-medium text-slate-500">{label}</span>
			{#if desc}<span class="mt-0.5 block text-xs leading-snug text-slate-400">{desc}</span>{/if}
		</div>
		{#if Icon}
			<span class="flex size-9 items-center justify-center rounded-lg {TONES[tone]}"><Icon class="size-[18px]" /></span>
		{/if}
	</div>
	<!-- angka & keterangan menempel di bawah agar kartu tidak berlubang saat setinggi kartu lain -->
	<div class="mt-auto pt-2 text-3xl font-semibold tracking-tight {accent}">{typeof value === 'number' ? fmtNum(value) : value}</div>
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
		{#if href}<ArrowUpRight class="ml-auto size-4 shrink-0 text-slate-300 transition group-hover:text-brand-600" />{/if}
	</div>
</svelte:element>
