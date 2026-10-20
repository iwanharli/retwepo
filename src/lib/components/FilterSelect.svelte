<script>
	import { getContext, untrack } from 'svelte';
	import { Hash } from '@lucide/svelte';
	import { PLATFORMS } from '#lib/constants.js';
	import PlatformIcon from './PlatformIcon.svelte';

	/**
	 * Pilihan filter di dalam drawer FilterBar.
	 * Pilihan sedikit (≤ 7) tampil sebagai tombol pil; daftar panjang sebagai dropdown.
	 * options: [[value, label]]; all: label pilihan kosong (mis. "Semua platform"); label: judul
	 */
	let { name, value = '', options, all, label = null, variant = null } = $props();
	const title = $derived(label ?? all.replace(/^Semua /, '').replace(/^./, (c) => c.toUpperCase()));
	const pills = $derived(variant ? variant === 'pills' : options.length <= 7);
	let current = $state(untrack(() => String(value ?? '')));
	$effect.pre(() => {
		current = String(value ?? '');
	});

	// daftarkan ke FilterBar agar nilai aktif tampil sebagai chip di bar (getter: selalu nilai terbaru)
	const bar = getContext('filterbar');
	bar?.register(untrack(() => name), {
		get options() {
			return options;
		},
		get all() {
			return all;
		}
	});
	const pill = (on) =>
		`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition ${on ? 'border-brand-600 bg-brand-600 text-white shadow-sm shadow-brand-600/25' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`;
</script>

<div>
	<span class="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</span>
	{#if pills}
		<div class="flex flex-wrap gap-1.5" role="radiogroup" aria-label={title}>
			<label class={pill(current === '')}><input type="radio" {name} value="" bind:group={current} class="sr-only" />Semua</label>
			{#each options as [v, l]}
				{@const on = current === String(v)}
				<label class={pill(on)}>
					<input type="radio" {name} value={String(v)} bind:group={current} class="sr-only" />
					{#if name === 'platform' && PLATFORMS[v]}<PlatformIcon platform={v} size={18} class="rounded-full {on ? 'ring-2 ring-white/60' : ''}" />{:else if name === 'campaign'}<Hash class="size-3.5 {on ? '' : 'text-violet-500'}" />{/if}
					{name === 'campaign' ? l.replace(/^#/, '') : l}
				</label>
			{/each}
		</div>
	{:else}
		<select {name} bind:value={current} class="input w-full {current ? 'border-brand-400 bg-brand-50 font-medium text-brand-700 ring-2 ring-brand-500/15' : ''}">
			<option value="">{all}</option>
			{#each options as [v, l]}<option value={String(v)}>{l}</option>{/each}
		</select>
	{/if}
</div>
