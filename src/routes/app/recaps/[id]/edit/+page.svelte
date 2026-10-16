<script>
	import { SquarePen, ArrowLeft, Info } from '@lucide/svelte';
	import { fmtDate } from '#lib/constants.js';
	import Flash from '#lib/components/Flash.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import RecapForm from '#lib/components/RecapForm.svelte';

	let { data, form } = $props();
	const r = $derived(data.recap);
</script>

<svelte:head><title>Edit Rekap · Retwepo</title></svelte:head>

<PageHeader title="Edit Rekap" description="Dicatat {fmtDate(r.createdAt, true)}{r.editedAt ? ` · terakhir diedit ${fmtDate(r.editedAt, true)}` : ''}" icon={SquarePen}>
	{#snippet actions()}
		<a href="/app/recaps" class="btn btn-secondary"><ArrowLeft /> Kembali ke riwayat</a>
	{/snippet}
</PageHeader>

<div class="mb-5 flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
	<Info class="mt-0.5 size-4 shrink-0" />
	<p>Rekap yang diedit akan diberi label <b>Diedit</b> beserta tanggal editnya, dan terlihat oleh admin.</p>
</div>

<Flash {form} />
{#key r.id}
	<RecapForm mode="edit" accounts={data.accounts} {form} initial={r.initial} recapId={r.id} />
{/key}
