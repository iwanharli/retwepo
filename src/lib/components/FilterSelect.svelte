<script>
	import { getContext, untrack } from 'svelte';
	/**
	 * Dropdown filter di dalam drawer FilterBar; menyala ungu saat berisi nilai (filter aktif).
	 * options: [[value, label]]; all: label pilihan kosong (mis. "Semua platform"); label: judul di atas dropdown
	 */
	let { name, value = '', options, all, label = null } = $props();
	const title = $derived(label ?? all.replace(/^Semua /, '').replace(/^./, (c) => c.toUpperCase()));
	const active = $derived(value !== '' && value !== null && value !== undefined);

	// daftarkan ke FilterBar agar nilai aktif tampil sebagai chip di bar
	const bar = getContext('filterbar');
	// pakai getter agar selalu membaca nilai terbaru
	bar?.register(untrack(() => name), { get options() { return options; }, get all() { return all; } });
</script>

<label class="block">
	<span class="mb-1 block text-xs font-medium text-slate-500">{title}</span>
	<select {name} value={value ?? ''} class="input w-full {active ? 'border-brand-400 bg-brand-50 font-medium text-brand-700 ring-2 ring-brand-500/15' : ''}">
		<option value="">{all}</option>
		{#each options as [v, l]}<option value={v}>{l}</option>{/each}
	</select>
</label>
