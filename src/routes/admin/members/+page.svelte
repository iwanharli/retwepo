<script>
	import { Users, Download, SearchX, Wallet } from '@lucide/svelte';
	import { USER_STATUS, fmtDate, fmtNum } from '#lib/constants.js';
	import Badge from '#lib/components/Badge.svelte';
	import Avatar from '#lib/components/Avatar.svelte';
	import PlatformIcon from '#lib/components/PlatformIcon.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import Flash from '#lib/components/Flash.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import UserActions from '#lib/components/UserActions.svelte';
	import UserListToolbar from '#lib/components/UserListToolbar.svelte';
	import CreateUserDialog from '#lib/components/CreateUserDialog.svelte';
	import CsvExportDialog from '#lib/components/CsvExportDialog.svelte';
	import { USER_EXPORT_COLUMNS, ACCOUNT_EXPORT_COLUMNS } from '#lib/constants.js';
	import SortTh from '#lib/components/SortTh.svelte';
	let { data, form } = $props();

	const DAY = 86400000;
	const idle = (d) => (d ? Math.floor((Date.now() - new Date(d)) / DAY) : null);
</script>

<svelte:head><title>User Terverifikasi · Admin Retwepo</title></svelte:head>

<PageHeader title="User Terverifikasi" description="User yang sudah disetujui beserta aktivitas rekapnya." icon={Users}>
	{#snippet actions()}
		<CsvExportDialog
			action="/admin/export/users"
			title="Export user ke CSV"
			description="Data user beserta jumlah rekap pada rentang tanggal yang dipilih — cocok untuk rekap pembayaran."
			statuses={[['approved', 'Aktif'], ['suspended', 'Ditangguhkan'], ['pending', 'Menunggu'], ['rejected', 'Ditolak'], ['incomplete', 'Belum isi form']]}
			defaultStatuses={data.f.status === 'all' ? ['approved', 'suspended'] : [data.f.status]}
			columns={USER_EXPORT_COLUMNS}
			q={data.f.q}
		/>
		<CreateUserDialog />
	{/snippet}
</PageHeader>

<UserListToolbar
	f={data.f}
	counts={data.counts}
	tabs={[['approved', 'Aktif'], ['suspended', 'Ditangguhkan'], ['all', 'Semua']]}
/>
<Flash {form} />

{#if data.rows.length}
	<div class="card overflow-x-auto p-0">
		<table class="table">
			<thead>
				<tr>
					<SortTh key="name" label="User" sort={data.f.sort} />
					<SortTh key="ewallet" label="E-wallet" sort={data.f.sort} />
					<SortTh key="accounts" label="Akun aktif" sort={data.f.sort} defaultDir="desc" />
					<SortTh key="month" label="Rekap 30 hari" sort={data.f.sort} defaultDir="desc" align="right" />
					<SortTh key="total" label="Total" sort={data.f.sort} defaultDir="desc" align="right" />
					<SortTh key="last" label="Terakhir rekap" sort={data.f.sort} defaultDir="desc" />
					<SortTh key="status" label="Status" sort={data.f.sort} />
					<th class="text-right">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each data.rows as u (u.id)}
					{@const days = idle(u.last_at)}
					<tr class="hover:bg-slate-50/70">
						<td>
							<a href="/admin/members/{u.id}" class="flex items-center gap-3">
								<Avatar user={{ nickname: u.nickname, email: u.email, avatarUrl: u.avatar_url }} size={36} />
								<span class="min-w-0">
									<span class="flex items-center gap-1.5 font-medium hover:underline">
										{u.nickname ?? '—'}
										{#if u.role === 'admin'}<Badge cls="bg-brand-100 text-brand-700">admin</Badge>{/if}
									</span>
									<span class="block truncate text-xs text-slate-500">{u.email}</span>
								</span>
							</a>
						</td>
						<td class="whitespace-nowrap">
							{#if u.ewallet_number}
								<div class="flex items-center gap-1.5 text-xs text-slate-500"><Wallet class="size-3.5" />{u.ewallet_provider}</div>
								<div class="font-mono text-sm">{u.ewallet_number}</div>
							{:else}<span class="text-slate-300">—</span>{/if}
						</td>
						<td>
							<div class="flex flex-wrap gap-1">
								{#each (u.accounts ?? []).filter((a) => a.status === 'approved') as a}
									<span title="@{a.username}"><PlatformIcon platform={a.platform} size={22} /></span>
								{:else}<span class="text-slate-300">—</span>{/each}
							</div>
						</td>
						<td class="text-right text-base font-semibold">{fmtNum(u.month)}</td>
						<td class="text-right text-slate-500">{fmtNum(u.total)}</td>
						<td class="whitespace-nowrap">
							{#if days === null}
								<span class="text-xs text-rose-600">Belum pernah</span>
							{:else}
								<div class="text-sm">{fmtDate(u.last_at)}</div>
								<div class="text-xs {days >= 7 ? 'text-rose-600' : 'text-slate-400'}">{days === 0 ? 'hari ini' : `${days} hari lalu`}</div>
							{/if}
						</td>
						<td>
							<Badge cls={USER_STATUS[u.status].cls} dot>{u.status === 'approved' ? 'Aktif' : USER_STATUS[u.status].label}</Badge>
							{#if u.status_note}<div class="mt-1 max-w-48 text-xs text-slate-500">{u.status_note}</div>{/if}
						</td>
						<td><UserActions {u} compact /></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<Pagination current={data.page} total={data.total} perPage={data.perPage} />
{:else}
	<EmptyState icon={SearchX} title="Tidak ada user" description="Tidak ada user terverifikasi yang cocok dengan pencarian." />
{/if}
