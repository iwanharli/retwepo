<script>
	import { History, Plus, SearchX } from '@lucide/svelte';
	import RecapFeed from '#lib/components/RecapFeed.svelte';
	import RecapFilters from '#lib/components/RecapFilters.svelte';
	import RecapStatusTabs from '#lib/components/RecapStatusTabs.svelte';
	import ViewToggle from '#lib/components/ViewToggle.svelte';
	import Flash from '#lib/components/Flash.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import { fmtNum, fmtDate, RANGE_PRESETS } from '#lib/constants.js';

	let { data, form } = $props();
	let total = $state(0);

	const rangeLabel = $derived(
		data.f.from || data.f.to ? `${data.f.from ? fmtDate(data.f.from) : '…'} – ${data.f.to ? fmtDate(data.f.to) : 'sekarang'}` : 'semua waktu'
	);
</script>

<svelte:head><title>Riwayat Rekap · Retwepo</title></svelte:head>

<PageHeader title="Riwayat Rekap" description="{fmtNum(total)} rekap · {rangeLabel}" icon={History}>
	{#snippet actions()}
		<ViewToggle view={data.view} />
		<a href="/app/recaps/new" class="btn btn-primary"><Plus /> Tambah Rekap</a>
	{/snippet}
</PageHeader>

<RecapStatusTabs counts={data.statusCounts} status={data.f.status} />
<RecapFilters f={data.f} campaigns={data.campaigns} accounts={data.accounts} view={data.view} presets={RANGE_PRESETS} />
<Flash {form} />

<RecapFeed list={data.list} feedUrl="/app/recaps/feed" detailBase="/app/recaps" sort={data.sort} view={data.view} canEdit bind:total>
	{#snippet empty()}
		<EmptyState icon={SearchX} title="Tidak ada rekap" description="Belum ada rekap pada rentang {rangeLabel} atau tidak ada yang cocok dengan filter.">
			<div class="flex gap-2">
				<a href="?from=&to=" class="btn btn-secondary">Lihat semua waktu</a>
				<a href="/app/recaps/new" class="btn btn-primary"><Plus /> Tambah Rekap</a>
			</div>
		</EmptyState>
	{/snippet}
</RecapFeed>
