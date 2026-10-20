<script>
	import { Images, SearchX } from '@lucide/svelte';
	import RecapFeed from '#lib/components/RecapFeed.svelte';
	import RecapFilters from '#lib/components/RecapFilters.svelte';
	import RecapStatusTabs from '#lib/components/RecapStatusTabs.svelte';
	import ViewToggle from '#lib/components/ViewToggle.svelte';
	import Flash from '#lib/components/Flash.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import { fmtNum, fmtDate } from '#lib/constants.js';

	let { data, form } = $props();
	let total = $state(0);

	const rangeLabel = $derived(
		data.f.from || data.f.to ? `${data.f.from ? fmtDate(data.f.from) : '…'} – ${data.f.to ? fmtDate(data.f.to) : 'sekarang'}` : 'semua waktu'
	);
</script>

<svelte:head><title>Semua Rekap · Admin Retwepo</title></svelte:head>

<PageHeader title="Semua Rekap" description="{fmtNum(total)} rekap dari semua user · {rangeLabel}" icon={Images}>
	{#snippet actions()}
		<ViewToggle />
	{/snippet}
</PageHeader>

<RecapStatusTabs counts={data.statusCounts} status={data.f.status} />
<RecapFilters f={data.f} campaigns={data.campaigns} filterUser={data.filterUser} filterAccount={data.filterAccount} placeholder="Cari nama user, email, username sosmed, URL, catatan…" />
<Flash {form} />

<RecapFeed list={data.list} feedUrl="/admin/recaps/feed" detailBase="/admin/recaps" sort={data.sort} view={data.view} showOwner canDelete bind:total>
	{#snippet empty()}
		<EmptyState icon={SearchX} title="Tidak ada rekap" description="Tidak ada rekap pada rentang {rangeLabel} yang cocok dengan filter.">
			<a href="?from=&to=" class="btn btn-secondary">Lihat semua waktu</a>
		</EmptyState>
	{/snippet}
</RecapFeed>
