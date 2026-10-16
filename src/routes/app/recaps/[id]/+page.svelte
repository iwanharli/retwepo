<script>
	import { SquarePen } from '@lucide/svelte';
	import RecapDetail from '#lib/components/RecapDetail.svelte';
	let { data } = $props();
</script>

<svelte:head><title>Rekap @{data.r.username} · Retwepo</title></svelte:head>

<RecapDetail r={data.r} history={data.history} backHref="/app/recaps" backLabel="Riwayat rekap">
	{#snippet actions()}
		{#if !data.r.deletedAt}<a href="/app/recaps/{data.r.id}/edit" class="btn btn-soft-brand"><SquarePen /> Edit rekap</a>{/if}
	{/snippet}
</RecapDetail>
