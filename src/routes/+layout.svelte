<script>
	import '../app.css';
	import Toaster from '#lib/components/Toaster.svelte';
	import AlertHost from '#lib/components/AlertHost.svelte';
	let { children } = $props();
</script>

<svelte:head><title>Retwepo — Rekap Postingan</title></svelte:head>

{@render children()}

<!-- notifikasi global: toast (pojok) & popup (tengah) -->
<Toaster />
<AlertHost />
