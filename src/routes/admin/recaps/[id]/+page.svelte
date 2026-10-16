<script>
	import { Trash2, Images, RotateCcw } from '@lucide/svelte';
	import { adminUserHref } from '#lib/constants.js';
	import RecapDetail from '#lib/components/RecapDetail.svelte';
	import ActionDialog from '#lib/components/ActionDialog.svelte';
	let { data } = $props();
	const r = $derived(data.r);
</script>

<svelte:head><title>Rekap @{r.username} · Admin Retwepo</title></svelte:head>

<RecapDetail {r} history={data.history} backHref="/admin/recaps" backLabel="Semua rekap" ownerHref={adminUserHref(r.userId, r.userStatus)}>
	{#snippet actions()}
		<a href="/admin/recaps?q={encodeURIComponent(r.username)}&from=&to=" class="btn btn-soft-brand"><Images /> Rekap lain akun ini</a>
		{#if r.deletedAt}
			<ActionDialog
				action="restore"
				tone="success"
				icon={RotateCcw}
				title="Pulihkan rekap ini?"
				description="Rekap kembali aktif, dihitung di statistik, dan pemilik mendapat notifikasi."
				confirmLabel="Pulihkan"
				triggerClass="btn btn-soft-success"
			>
				{#snippet trigger()}<RotateCcw /> Pulihkan{/snippet}
				<div class="text-sm"><b>@{r.username}</b> · oleh {r.nickname ?? r.email}</div>
				{#if r.deleteReason}<p class="mt-1.5 text-xs text-slate-500">Alasan dihapus: {r.deleteReason}</p>{/if}
			</ActionDialog>
		{:else}
			<ActionDialog
				action="delete"
				tone="danger"
				icon={Trash2}
				title="Hapus rekap ini?"
				description="Rekap tidak lagi dihitung di statistik & pembayaran. Pemilik akan melihat label Dihapus beserta alasannya, dan rekap masih bisa dipulihkan."
				confirmLabel="Hapus rekap"
				note={{ label: 'Alasan penghapusan', placeholder: 'Mis. bukti palsu, duplikat…', presets: ['Rekap duplikat', 'Bukti tidak valid / palsu', 'Bukan milik akun ini', 'Diminta oleh user'], hint: 'Opsional — ditampilkan kepada user & dicatat di log.' }}
				triggerClass="btn btn-soft-danger btn-icon"
				triggerLabel="Hapus rekap"
			>
				{#snippet trigger()}<Trash2 />{/snippet}
				<div class="text-sm"><b>@{r.username}</b> · oleh {r.nickname ?? r.email}</div>
			</ActionDialog>
		{/if}
	{/snippet}
</RecapDetail>
