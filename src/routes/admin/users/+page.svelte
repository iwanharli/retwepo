<script>
	import { UserPlus, Inbox, Wallet, CalendarClock, Eye, BadgeCheck, CircleOff } from '@lucide/svelte';
	import { ACCOUNT_STATUS, fmtDate } from '#lib/constants.js';
	import Badge from '#lib/components/Badge.svelte';
	import Avatar from '#lib/components/Avatar.svelte';
	import PlatformTag from '#lib/components/PlatformTag.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import Flash from '#lib/components/Flash.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import UserActions from '#lib/components/UserActions.svelte';
	import UserListToolbar from '#lib/components/UserListToolbar.svelte';
	import CsvExportDialog from '#lib/components/CsvExportDialog.svelte';
	import { USER_EXPORT_COLUMNS, ACCOUNT_EXPORT_COLUMNS } from '#lib/constants.js';
	import SortTh from '#lib/components/SortTh.svelte';
	let { data, form } = $props();
</script>

<svelte:head><title>Pendaftaran User · Admin Retwepo</title></svelte:head>

<PageHeader title="Pendaftaran User" description={data.f.status === 'rejected' ? 'User yang ditolak bisa memperbaiki data dan mendaftar ulang; mereka akan kembali ke tab Menunggu.' : data.f.status === 'incomplete' ? 'User yang sudah login Google tapi belum mengisi form pendaftaran.' : 'Tinjau dan setujui user baru beserta akun sosmed yang mereka ajukan.'} icon={UserPlus}>
	{#snippet actions()}
		<CsvExportDialog
			action="/admin/export/users"
			title="Export pendaftaran ke CSV"
			description="Data pendaftar beserta akun sosmed yang diajukan."
			statuses={[['approved', 'Aktif'], ['suspended', 'Ditangguhkan'], ['pending', 'Menunggu'], ['rejected', 'Ditolak'], ['incomplete', 'Belum isi form']]}
			defaultStatuses={[data.f.status ?? 'pending']}
			columns={USER_EXPORT_COLUMNS}
			q={data.f.q}
		/>
	{/snippet}
</PageHeader>

<UserListToolbar
	f={data.f}
	counts={data.counts}
	tabs={[['pending', 'Menunggu'], ['rejected', 'Ditolak'], ['incomplete', 'Belum isi form']]}
/>
<Flash {form} />

{#if data.rows.length}
	<div class="card overflow-x-auto p-0">
		<table class="table table-cards">
			<thead>
				<tr>
					<SortTh key="name" label="User" sort={data.f.sort} />
					<SortTh key="ewallet" label="E-wallet" sort={data.f.sort} />
					<th>Akun sosmed diajukan</th>
					<SortTh key="registered" label="Mendaftar" sort={data.f.sort} defaultDir="desc" />
					{#if data.f.status === 'rejected'}<th>Alasan penolakan</th>{/if}<th class="text-right">Aksi</th></tr>
			</thead>
			<tbody>
				{#each data.rows as u (u.id)}
					<tr class="hover:bg-slate-50/70">
						<td data-label="">
							<div class="flex items-center gap-3">
								<Avatar user={{ nickname: u.nickname, email: u.email, avatarUrl: u.avatar_url }} size={36} />
								<span class="min-w-0">
									<span class="block font-medium">{u.nickname ?? '—'}</span>
									<span class="block truncate text-xs text-slate-500">{u.email}</span>
								</span>
							</div>
						</td>
						<td class="whitespace-nowrap" data-label="E-wallet">
							{#if u.ewallet_number}
								<div class="flex items-center gap-1.5 text-xs text-slate-500"><Wallet class="size-3.5" />{u.ewallet_provider}</div>
								<div class="font-mono text-sm">{u.ewallet_number}</div>
								{#if u.ewallet_check === 'found'}<div class="mt-0.5 flex items-center gap-1 text-xs font-medium text-emerald-700"><BadgeCheck class="size-3.5" />a.n. {u.ewallet_holder}</div>
								{:else if u.ewallet_check === 'not_found'}<div class="mt-0.5 flex items-center gap-1 text-xs font-medium text-rose-600"><CircleOff class="size-3.5" />Tidak ditemukan</div>{/if}
							{:else}<span class="text-slate-300">—</span>{/if}
						</td>
						<td data-label="Akun sosmed">
							<div class="flex flex-col gap-1">
								{#each u.accounts ?? [] as a}
									<span class="flex items-center gap-1.5 {a.status === 'rejected' ? 'line-through opacity-50' : ''}">
										<PlatformTag platform={a.platform} username={a.username} size={18} />
										<!-- label hanya bila status akun berbeda dari status pendaftaran user -->
										{#if a.status === 'approved'}<Badge cls={ACCOUNT_STATUS.approved.cls}>{ACCOUNT_STATUS.approved.label}</Badge>{/if}
									</span>
								{:else}<span class="text-slate-300">—</span>{/each}
							</div>
						</td>
						<td class="whitespace-nowrap text-slate-500" data-label="Mendaftar">
							<span class="flex items-center gap-1.5"><CalendarClock class="size-3.5" />{fmtDate(u.registered_at ?? u.created_at, true)}</span>
						</td>
						{#if data.f.status === 'rejected'}<td class="max-w-64 text-sm text-slate-600" data-label="Alasan penolakan">{u.status_note ?? '—'}</td>{/if}
						<td data-cell="actions"><div class="flex justify-end gap-1.5"><a href="/admin/users/{u.id}" class="btn btn-soft-brand btn-sm" title="Lihat detail user"><Eye /> Detail</a>{#if data.f.status === 'pending'}<UserActions {u} compact />{/if}</div></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<Pagination current={data.page} total={data.total} perPage={data.perPage} />
{:else}
	<EmptyState icon={Inbox} title="Tidak ada pendaftaran" description="Belum ada user di kategori ini. Pendaftaran baru akan muncul di tab Menunggu." />
{/if}
