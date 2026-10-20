<script>
	/**
	 * Dropdown filter: menyala ungu saat berisi nilai (filter aktif).
	 * options: [[value, label]]; all: label pilihan kosong (mis. "Semua platform")
	 */
	let { name, value = '', options, all, label = all } = $props();
	const active = $derived(value !== '' && value !== null && value !== undefined);
</script>

<select
	{name}
	value={value ?? ''}
	aria-label={label}
	class="input w-full sm:w-auto sm:min-w-44 {active ? 'border-brand-400 bg-brand-50 font-medium text-brand-700 ring-2 ring-brand-500/15' : ''}"
>
	<option value="">{all}</option>
	{#each options as [v, l]}<option value={v}>{l}</option>{/each}
</select>
