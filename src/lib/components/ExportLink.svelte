<script>
	import { Download } from '@lucide/svelte';
	/** Tombol ke halaman Export Data; params = isian awal (jenis data & filter halaman ini) */
	let { params = {}, cls = 'btn btn-secondary' } = $props();
	const href = $derived.by(() => {
		const u = new URLSearchParams();
		for (const [k, v] of Object.entries(params)) {
			if (Array.isArray(v)) v.forEach((x) => u.append(k, x));
			else if (v !== null && v !== undefined && v !== '') u.set(k, v);
		}
		return `/admin/export?${u}`;
	});
</script>

<a {href} class={cls}><Download /> Export CSV</a>
