<script>
	import { toastResult } from '#lib/toast.svelte.js';
	import { enhance } from '$app/forms';
	import { invalidate, invalidateAll } from '$app/navigation';
	import { ShieldCheck, ShieldX, BadgeCheck, Check, X, Inbox, CalendarClock } from '@lucide/svelte';
	import { fmtDate, adminUserHref } from '#lib/constants.js';
	import PlatformTag from '#lib/components/PlatformTag.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import Flash from '#lib/components/Flash.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import AccountListToolbar from '#lib/components/AccountListToolbar.svelte';
	import SortTh from '#lib/components/SortTh.svelte';
	import ActionDialog from '#lib/components/ActionDialog.svelte';
	import CsvExportDialog from '#lib/components/CsvExportDialog.svelte';
	import { USER_EXPORT_COLUMNS, ACCOUNT_EXPORT_COLUMNS } from '#lib/constants.js';
	import AccountSummary from '#lib/components/AccountSummary.svelte';

	let { data, form } = $props();
	let selected = $state([]);
	const allIds = $derived(data.rows.map((r) => r.id));
	const pending = $derived(data.f.status === 'pending');

	const after = () => async ({ update }) => {
		await update();
		selected = [];
		invalidate('app:pending');
	};
	// setujui: notifikasi dengan tombol Batalkan
	const approved = () => async ({ result, update }) => {
		if (result.type === 'success') {
			selected = [];
			await invalidateAll();
			toastResult(result);
		} else await update();
	};
	const selectedRows = $derived(data.rows.filter((r) => selected.includes(r.id)));
	// setelah aksi lewat modal: muat ulang data & kosongkan pilihan
	async function done(result) {
		selected = [];
		await invalidateAll();
		toastResult(result);
	}
	const ACC_PRESETS = ['Username tidak ditemukan', 'Akun bukan milik user ini', 'Akun private / tidak bisa dicek', 'Akun duplikat'];
</script>

<svelte:head><title>Pengajuan Akun · Admin Retwepo</title></svelte:head>

<PageHeader
	title="Pengajuan Akun Sosmed"
	description="Akun sosmed tambahan dari user yang sudah terverifikasi. Akun milik user baru ditinjau di Pendaftaran User."
	icon={ShieldCheck}>
	{#snippet actions()}
		<CsvExportDialog
			action="/admin/export/accounts"
			title="Export pengajuan akun ke CSV"
			description="Akun sosmed yang diajukan beserta pemiliknya."
			statuses={[['approved', 'Terverifikasi'], ['pending', 'Menunggu'], ['rejected', 'Ditolak / dicabut']]}
			defaultStatuses={[data.f.status ?? 'pending']}
			columns={ACCOUNT_EXPORT_COLUMNS}
			platformFilter
			ownerFilter={true}
			q={data.f.q}
			platform={data.f.platform}
		/>
	{/snippet}
</PageHeader>

<AccountListToolbar
	f={data.f}
	counts={data.counts}
	tabs={[['pending', 'Menunggu'], ['rejected', 'Ditolak']]}
/>
<Flash {form} />

{#if data.rows.length}
	{#if pending}
		<div class="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-card">
			<span class="mr-auto text-slate-500"><b class="text-slate-900">{selected.length}</b> akun dipilih</span>
			<ActionDialog
				action="approveAccount"
				fields={{ id: selected }}
				tone="success"
				icon={BadgeCheck}
				title="Setujui {selected.length} akun?"
				description="Akun yang disetujui langsung bisa dipakai pemiliknya untuk membuat rekap."
				confirmLabel="Setujui {selected.length} akun"
				triggerClass="btn btn-success btn-sm"
				triggerDisabled={!selected.length}
				onSuccess={done}
			>
				{#snippet trigger()}<Check /> Setujui terpilih{/snippet}
				<AccountSummary accounts={selectedRows} />
			</ActionDialog>
			<ActionDialog
				action="rejectAccount"
				fields={{ id: selected }}
				tone="danger"
				icon={ShieldX}
				title="Tolak {selected.length} akun?"
				description="Pemilik akun akan melihat alasan ini. Username yang ditolak bisa didaftarkan ulang."
				confirmLabel="Tolak {selected.length} akun"
				note={{ label: 'Alasan penolakan', presets: ACC_PRESETS, hint: 'Alasan yang sama dipakai untuk semua akun terpilih.' , required: true }}
				triggerClass="btn btn-soft-danger btn-sm"
				triggerDisabled={!selected.length}
				onSuccess={done}
			>
				{#snippet trigger()}<X /> Tolak terpilih{/snippet}
				<AccountSummary accounts={selectedRows} />
			</ActionDialog>
		</div>
	{/if}

	<div class="card overflow-x-auto p-0">
		<table class="table table-cards">
			<thead>
				<tr>
					{#if pending}
						<th class="w-10">
							<input
								type="checkbox"
								class="size-4 accent-brand-600"
								checked={selected.length > 0 && selected.length === allIds.length}
								onchange={(e) => (selected = e.currentTarget.checked ? [...allIds] : [])}
								aria-label="Pilih semua"
							/>
						</th>
					{/if}
					<SortTh key="account" label="Akun" sort={data.f.sort} />
					<SortTh key="owner" label="Pemilik" sort={data.f.sort} />
					<SortTh key="created" label="Diajukan" sort={data.f.sort} defaultDir="desc" />
					{#if !pending}<th>Alasan penolakan</th>{/if}<th class="text-right">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each data.rows as a (a.id)}
					<tr class="hover:bg-slate-50/70">
						{#if pending}<td data-label="Pilih"><input type="checkbox" class="size-4 accent-brand-600" value={a.id} bind:group={selected} /></td>{/if}
						<td data-label=""><a href="/admin/social/{a.id}" class="hover:underline"><PlatformTag platform={a.platform} username={a.username} size={28} /></a></td>
						<td data-label="Pemilik">
							<a href={adminUserHref(a.user_id, a.user_status)} class="font-medium hover:underline">{a.nickname ?? a.email}</a>
							<div class="text-xs text-slate-500">{a.email}</div>
						</td>
						<td class="whitespace-nowrap text-slate-500" data-label="Diajukan"><span class="flex items-center gap-1.5"><CalendarClock class="size-3.5" />{fmtDate(a.created_at, true)}</span></td>
						{#if !pending}<td class="max-w-64 text-sm text-slate-600" data-label="Alasan penolakan">{a.status_note ?? '—'}</td>{/if}
						<td data-cell="actions">
							<div class="flex justify-end gap-1.5">
								<form method="POST" action="?/approveAccount" use:enhance={approved}>
									<input type="hidden" name="id" value={a.id} /><button class="btn btn-success btn-sm"><Check /> Setujui</button>
								</form>
								{#if pending}
									<ActionDialog
										action="rejectAccount"
										fields={{ id: a.id }}
										tone="danger"
										icon={ShieldX}
										title="Tolak akun ini?"
										description="Pemilik akun akan melihat alasan ini. Username yang ditolak bisa didaftarkan ulang."
										confirmLabel="Tolak akun"
										note={{ label: 'Alasan penolakan', presets: ACC_PRESETS, hint: 'Ditampilkan kepada pemilik akun.' , required: true }}
										triggerClass="btn btn-soft-danger btn-sm"
										onSuccess={done}
									>
										{#snippet trigger()}<X /> Tolak{/snippet}
										<AccountSummary accounts={[a]} />
									</ActionDialog>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<Pagination current={data.page} total={data.total} perPage={data.perPage} />
{:else}
	<EmptyState icon={Inbox} title="Tidak ada pengajuan" description="Semua akun sudah ditinjau. Pengajuan baru akan muncul di tab Menunggu." />
{/if}
