<script>
	/**
	 * Gambar kecil screenshot untuk kartu/tabel: memuat versi thumbnail (ringan),
	 * kotak berkilau selama memuat, lalu muncul dengan fade-in.
	 * dim: tampilkan redup & abu-abu (rekap yang dihapus)
	 */
	let { path, alt = '', class: cls = '', dim = false } = $props();
	let img = $state();
	let loaded = $state(false);
	let failed = $state(false);

	// gambar dari cache bisa selesai sebelum halaman aktif (onload terlewat) — cek sekali saat terpasang
	$effect(() => {
		if (img?.complete && img.naturalWidth > 0) loaded = true;
	});
	const look = $derived(!loaded ? 'opacity-0' : dim ? 'opacity-50 grayscale' : 'opacity-100');
</script>

<span class="relative block size-full overflow-hidden {loaded ? 'bg-slate-100' : 'sk rounded-none'}">
	{#if !failed}
		<img
			bind:this={img}
			src="/uploads/{path}?thumb"
			{alt}
			loading="lazy"
			decoding="async"
			width="480"
			height="300"
			onload={() => (loaded = true)}
			onerror={() => (failed = true)}
			class="size-full object-cover object-top transition-[opacity,transform] duration-300 {look} {cls}"
		/>
	{/if}
</span>
