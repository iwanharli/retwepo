<script>
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Trash2, LoaderCircle, CircleCheck, SquarePen, Eye, RotateCcw } from '@lucide/svelte';
	import RecapCard from './RecapCard.svelte';
	import RecapTable from './RecapTable.svelte';
	import ActionDialog from './ActionDialog.svelte';
	import PlatformTag from './PlatformTag.svelte';
	import TypeBadge from './TypeBadge.svelte';
	import CampaignBadge from './CampaignBadge.svelte';
	import { fmtNum, fmtDate } from '#lib/constants.js';

	/**
	 * Daftar rekap dengan infinite scroll (grid/tabel).
	 * list: halaman pertama dari server; feedUrl: endpoint JSON halaman berikutnya
	 * showOwner: tampilkan nama user (admin); empty: snippet saat tidak ada data
	 * total (bindable): jumlah total, ikut berkurang saat rekap dihapus
	 */
	// canDelete: admin boleh menghapus; canEdit: user mengedit rekap miliknya sendiri
	// detailBase: awalan URL halaman detail rekap
	let { list, feedUrl, detailBase, sort = null, view = 'grid', showOwner = false, canDelete = false, canEdit = false, empty, total = $bindable(0) } = $props();

	// isi awal langsung dari data server (agar render server tidak menampilkan kosong)
	let rows = $state(untrack(() => list.rows));
	let nextPage = $state(2);
	let loading = $state(false);
	let failed = $state(false);
	let sentinel = $state();

	// reset setiap kali filter berubah (data halaman pertama baru dari server)
	$effect(() => {
		rows = list.rows;
		total = list.total;
		nextPage = 2;
		failed = false;
	});

	const done = $derived(rows.length >= total);

	async function loadMore() {
		if (loading || done) return;
		loading = true;
		failed = false;
		try {
			const params = new URLSearchParams(page.url.search);
			params.set('page', String(nextPage));
			const res = await fetch(`${feedUrl}?${params}`);
			if (!res.ok) throw new Error(String(res.status));
			const more = await res.json();
			const seen = new Set(rows.map((r) => r.id));
			rows = [...rows, ...more.rows.filter((r) => !seen.has(r.id))];
			total = more.total;
			nextPage += 1;
		} catch {
			failed = true;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (!sentinel) return;
		const io = new IntersectionObserver((entries) => entries[0].isIntersecting && !failed && loadMore(), {
			rootMargin: '600px'
		});
		io.observe(sentinel);
		return () => io.disconnect();
	});

	function removeRow(id) {
		rows = rows.filter((r) => r.id !== id);
		total -= 1;
	}
</script>

{#snippet del(r)}
	<a href="{detailBase}/{r.id}" class="btn btn-secondary btn-sm"><Eye /> Detail</a>
	{#if canEdit && !r.deletedAt}
		<a href="/app/recaps/{r.id}/edit" class="btn btn-soft-brand btn-sm"><SquarePen /> Edit</a>
	{/if}
	{#if canDelete && r.deletedAt}
	<ActionDialog
		action="restore"
		fields={{ id: r.id }}
		tone="success"
		icon={RotateCcw}
		title="Pulihkan rekap ini?"
		description="Rekap kembali aktif, dihitung di statistik, dan pemilik mendapat notifikasi."
		confirmLabel="Pulihkan"
		triggerClass="btn btn-soft-success btn-sm"
		onSuccess={() => removeRow(r.id)}
	>
		{#snippet trigger()}<RotateCcw /> Pulihkan{/snippet}
		<div class="text-sm"><b>@{r.username}</b> · {fmtDate(r.postedAt, true)}</div>
		{#if r.deleteReason}<p class="mt-1.5 text-xs text-slate-500">Alasan dihapus: {r.deleteReason}</p>{/if}
	</ActionDialog>
	{:else if canDelete}
	<ActionDialog
		action="delete"
		fields={{ id: r.id }}
		tone="danger"
		icon={Trash2}
		title="Hapus rekap ini?"
		description="Rekap tidak lagi dihitung di statistik & pembayaran. Pemilik akan melihat label Dihapus beserta alasannya, dan rekap masih bisa dipulihkan."
		confirmLabel="Hapus rekap"
		note={{ label: 'Alasan penghapusan', placeholder: 'Mis. bukti palsu, duplikat…', presets: ['Rekap duplikat', 'Bukti tidak valid / palsu', 'Bukan milik akun ini', 'Diminta oleh user'], hint: 'Opsional — ditampilkan kepada user & dicatat di log.' }}
		triggerClass="btn btn-soft-danger btn-sm btn-icon"
		triggerLabel="Hapus rekap"
		onSuccess={() => removeRow(r.id)}
	>
		{#snippet trigger()}<Trash2 />{/snippet}
		<div class="flex items-center justify-between gap-3">
			<PlatformTag platform={r.platform} username={r.username} size={24} />
			<span class="flex items-center gap-1.5"><CampaignBadge name={r.campaign} /><TypeBadge type={r.type} /></span>
		</div>
		<div class="mt-2 text-xs text-slate-500">
			{#if showOwner}oleh <b class="text-slate-700">{r.nickname ?? r.email}</b>{' · '}{/if}{fmtDate(r.postedAt, true)}
		</div>
		{#if r.url}<div class="mt-1 truncate text-xs text-brand-600">{r.url}</div>{/if}
	</ActionDialog>
	{/if}
{/snippet}

{#if rows.length}
	{#if view === 'list'}
		<RecapTable {rows} {showOwner} {detailBase} {sort} actions={del} />
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 2xl:grid-cols-4 min-[1800px]:grid-cols-5">
			{#each rows as r (r.id)}
				<RecapCard {r} href="{detailBase}/{r.id}" owner={showOwner ? (r.nickname ?? r.email) : null}>{@render del(r)}</RecapCard>
			{/each}
		</div>
	{/if}

	<div bind:this={sentinel} class="flex flex-col items-center gap-2 py-10 text-sm text-slate-500">
		{#if loading}
			<span class="flex items-center gap-2"><LoaderCircle class="size-4 animate-spin" /> Memuat rekap…</span>
		{:else if failed}
			<span>Gagal memuat data.</span>
			<button class="btn btn-secondary btn-sm" onclick={loadMore}>Coba lagi</button>
		{:else if done}
			<span class="flex items-center gap-2"><CircleCheck class="size-4 text-emerald-500" /> Semua {fmtNum(total)} rekap sudah ditampilkan</span>
		{/if}
		{#if !done}<span class="text-xs text-slate-400">{fmtNum(rows.length)} dari {fmtNum(total)}</span>{/if}
	</div>
{:else}
	{@render empty()}
{/if}
