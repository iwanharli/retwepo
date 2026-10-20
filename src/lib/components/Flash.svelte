<script>
	import { showAlert } from '#lib/toast.svelte.js';

	/**
	 * Hasil form action (form.error / form.success) ditampilkan sebagai popup di tengah layar:
	 * error → perlu ditutup dengan tombol; berhasil → tertutup otomatis.
	 */
	let { form } = $props();
	let shown = null;
	$effect(() => {
		if (!form || form === shown) return;
		shown = form;
		if (form.error) showAlert({ tone: 'error', message: form.error });
		else if (form.success) showAlert({ tone: 'success', message: form.success });
	});
</script>
