<script>
	import { BadgeCheck, SearchX, ShieldOff, Images, UserCheck, Ban, Users } from '@lucide/svelte';
	import { page } from '$app/state';
	import { USER_STATUS, fmtDate, fmtNum, adminUserHref } from '#lib/constants.js';
	import Badge from '#lib/components/Badge.svelte';
	import PlatformTag from '#lib/components/PlatformTag.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import Flash from '#lib/components/Flash.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import AccountListToolbar from '#lib/components/AccountListToolbar.svelte';
	import SortTh from '#lib/components/SortTh.svelte';
	import ActionDialog from '#lib/components/ActionDialog.svelte';
	import AddAccountDialog from '#lib/components/AddAccountDialog.svelte';
	import CsvExportDialog from '#lib/components/CsvExportDialog.svelte';
	import { USER_EXPORT_COLUMNS, ACCOUNT_EXPORT_COLUMNS } from '#lib/constants.js';
	import AccountSummary from '#lib/components/AccountSummary.svelte';

	let { data, form } = $props();

	function ownerHref(val) {
		const u = new URLSearchParams(page.url.search);
		u.delete('page');
		if (val === 'approved') u.delete('owner');
		else u.set('owner', val);
		return '?' + u;
	}
	const DAY = 86400000;
	const idle = (d) => (d ? Math.floor((Date.now() - new Date(d)) / DAY) : null);
</script>

<svelte:head><title>Akun Terverifikasi · Admin Retwepo</title></svelte:head>

<PageHeader title="Akun Sosmed Terverifikasi" description={data.owner === 'suspended' ? `${fmtNum(data.total)} akun milik user yang sedang ditangguhkan — tidak bisa dipakai rekap sampai pemiliknya diaktifkan.` : `${fmtNum(data.total)} akun terverifikasi${data.owner === 'all' ? '' : ' milik user aktif'}.`} icon={BadgeCheck}>
	{#snippet actions()}
		<CsvExportDialog
			action="/admin/export/accounts"
			title="Export akun sosmed ke CSV"
			description="Daftar akun beserta pemilik dan jumlah rekap pada rentang tanggal yang dipilih."
			statuses={[['approved', 'Terverifikasi'], ['pending', 'Menunggu'], ['rejected', 'Ditolak / dicabut']]}
			defaultStatuses={['approved']}
			columns={ACCOUNT_EXPORT_COLUMNS}
			platformFilter
			ownerFilter={data.owner === 'approved'}
			q={data.f.q}
			platform={data.f.platform}
		/>
		<AddAccountDialog />
	{/snippet}
</PageHeader>

<!-- status pemilik akun -->
<div class="mb-4 flex flex-wrap gap-1.5">
	{#each [['approved', 'Pemilik aktif', UserCheck], ['suspended', 'Pemilik ditangguhkan', Ban], ['all', 'Semua', Users]] as [val, lbl, Icon]}
		{@const active = data.owner === val}
		<a
			href={ownerHref(val)}
			class="inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition {active
				? val === 'suspended'
					? 'bg-amber-500 text-white shadow-sm'
					: 'bg-slate-900 text-white shadow-sm'
				: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}"
		>
			<Icon class="size-4" />{lbl}
			<span class="rounded-full px-1.5 text-xs {active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}">{fmtNum(data.ownerCounts[val])}</span>
		</a>
	{/each}
</div>

<AccountListToolbar f={data.f} keep={{ owner: data.owner === 'approved' ? null : data.owner }} />
<Flash {form} />

{#if data.rows.length}
	<div class="card overflow-x-auto p-0">
		<table class="table table-cards">
			<thead>
				<tr>
					<SortTh key="account" label="Akun" sort={data.f.sort} />
					<SortTh key="owner" label="Pemilik" sort={data.f.sort} />
					<SortTh key="month" label="Rekap 30 hari" sort={data.f.sort} defaultDir="desc" align="right" />
					<SortTh key="total" label="Total" sort={data.f.sort} defaultDir="desc" align="right" />
					<SortTh key="last" label="Terakhir dipakai" sort={data.f.sort} defaultDir="desc" />
					<SortTh key="approved" label="Disetujui" sort={data.f.sort} defaultDir="desc" />
					<th class="text-right">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each data.rows as a (a.id)}
					{@const days = idle(a.last_at)}
					<tr class="hover:bg-slate-50/70">
						<td data-label=""><a href="/admin/social/{a.id}" class="hover:underline"><PlatformTag platform={a.platform} username={a.username} size={28} /></a></td>
						<td data-label="Pemilik">
							<a href={adminUserHref(a.user_id, a.user_status)} class="font-medium hover:underline">{a.nickname ?? a.email}</a>
							<div class="flex items-center gap-1.5 text-xs text-slate-500">
								{a.email}
								{#if a.user_status !== 'approved'}<Badge cls={USER_STATUS[a.user_status].cls}>user {USER_STATUS[a.user_status].label.toLowerCase()}</Badge>{/if}
							</div>
						</td>
						<td class="text-right text-base font-semibold" data-label="Rekap 30 hari">{fmtNum(a.month)}</td>
						<td class="text-right text-slate-500" data-label="Total">{fmtNum(a.total)}</td>
						<td class="whitespace-nowrap" data-label="Terakhir dipakai">
							{#if days === null}
								<span class="text-xs text-rose-600">Belum pernah</span>
							{:else}
								<div class="text-sm">{fmtDate(a.last_at)}</div>
								<div class="text-xs {days >= 7 ? 'text-rose-600' : 'text-slate-400'}">{days === 0 ? 'hari ini' : `${days} hari lalu`}</div>
							{/if}
						</td>
						<td class="whitespace-nowrap text-slate-500" data-label="Disetujui">{fmtDate(a.reviewed_at ?? a.created_at)}</td>
						<td data-cell="actions">
							<div class="flex justify-end gap-1.5">
								<a href="/admin/recaps?q={encodeURIComponent(a.username)}&from=&to=" class="btn btn-soft-brand btn-sm" title="Lihat rekap akun ini"><Images /> Rekap</a>
								<ActionDialog
									action="rejectAccount"
									fields={{ id: a.id }}
									tone="danger"
									icon={ShieldOff}
									title="Cabut verifikasi akun?"
									description="Akun tidak bisa dipakai untuk rekap lagi dan username-nya bisa didaftarkan user lain. Rekap lama tetap tersimpan."
									confirmLabel="Cabut verifikasi"
									note={{ label: 'Alasan pencabutan', presets: ['Akun sudah tidak dipakai', 'Akun bukan milik user ini', 'Melanggar ketentuan'], hint: 'Ditampilkan kepada pemilik akun.' , required: true }}
									triggerClass="btn btn-soft-danger btn-sm"
								>
									{#snippet trigger()}<ShieldOff /> Cabut{/snippet}
									<AccountSummary accounts={[a]} />
									<p class="mt-2.5 border-t border-slate-200 pt-2.5 text-xs text-slate-500">{fmtNum(a.total)} rekap tercatat dari akun ini.</p>
								</ActionDialog>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<Pagination current={data.page} total={data.total} perPage={data.perPage} />
{:else}
	<EmptyState icon={SearchX} title="Tidak ada akun" description="Tidak ada akun terverifikasi yang cocok dengan filter." />
{/if}
