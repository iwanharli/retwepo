<script>
	import { Users, Download, SearchX, Wallet, Eye } from '@lucide/svelte';
	import { USER_STATUS, fmtDate, fmtNum, daysAgoWib, daysAgoLabel } from '#lib/constants.js';
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
	import SortTh from '#lib/components/SortTh.svelte';
	let { data, form } = $props();

	const idle = daysAgoWib; // hari kalender WIB (bukan per 24 jam)
</script>

<svelte:head><title>User Terverifikasi · Admin Retwepo</title></svelte:head>

<PageHeader title="User Terverifikasi" description="User yang sudah disetujui beserta aktivitas rekapnya." icon={Users}>
	{#snippet actions()}
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
		<table class="table table-cards md:min-w-[860px]">
			<thead>
				<tr>
					<SortTh key="name" label="User" sort={data.f.sort} />
					<SortTh key="ewallet" label="E-wallet" sort={data.f.sort} class="w-36" />
					<SortTh key="accounts" label="Akun aktif" sort={data.f.sort} defaultDir="desc" class="hidden w-28 2xl:table-cell" />
					<SortTh key="today" label="Hari ini" sort={data.f.sort} defaultDir="desc" align="right" class="w-24" />
					<SortTh key="week" label="7 hari" sort={data.f.sort} defaultDir="desc" align="right" class="hidden w-20 xl:table-cell" />
					<SortTh key="month" label="30 hari" sort={data.f.sort} defaultDir="desc" align="right" class="w-24" />
					<SortTh key="active" label="Hari aktif" sort={data.f.sort} defaultDir="desc" align="right" class="w-28" />
					<SortTh key="last" label="Terakhir rekap" sort={data.f.sort} defaultDir="desc" class="w-32" />
					<SortTh key="status" label="Status" sort={data.f.sort} class="w-32" />
					<th class="w-52 text-right">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each data.rows as u (u.id)}
					{@const days = idle(u.last_at)}
					<tr class="hover:bg-slate-50/70">
						<td data-label="">
							<div class="flex items-center gap-3">
								<Avatar user={{ nickname: u.nickname, email: u.email, avatarUrl: u.avatar_url }} size={36} />
								<span class="min-w-0">
									<span class="flex items-center gap-1.5 font-medium">
										{u.nickname ?? '—'}
										{#if u.role === 'admin'}<Badge cls="bg-brand-100 text-brand-700">admin</Badge>{/if}
									</span>
									<span class="block truncate text-xs text-slate-500">{u.email}</span>
								</span>
							</div>
						</td>
						<td class="whitespace-nowrap" data-label="E-wallet">
							{#if u.ewallet_number}
								<div class="flex items-center gap-1.5 text-xs text-slate-500"><Wallet class="size-3.5" />{u.ewallet_provider}</div>
								<div class="font-mono text-sm">{u.ewallet_number}</div>
							{:else}<span class="text-slate-300">—</span>{/if}
						</td>
						<td class="hidden 2xl:table-cell" data-label="Akun aktif">
							<div class="flex flex-wrap gap-1">
								{#each (u.accounts ?? []).filter((a) => a.status === 'approved') as a}
									<span title="@{a.username}"><PlatformIcon platform={a.platform} size={22} /></span>
								{:else}<span class="text-slate-300">—</span>{/each}
							</div>
						</td>
						<td class="text-right" data-label="Hari ini">{#if u.today}<span class="inline-flex min-w-7 justify-center rounded-md bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">{fmtNum(u.today)}</span>{:else}<span class="text-slate-300">0</span>{/if}</td>
						<td class="hidden text-right font-medium text-slate-700 xl:table-cell" data-label="7 hari">{fmtNum(u.week)}</td>
						<td class="text-right text-base font-semibold" data-label="30 hari">{fmtNum(u.month)}</td>
						<td class="text-right" data-label="Hari aktif" title="Jumlah hari dengan minimal 1 rekap dalam 30 hari terakhir">
							<span class="font-medium text-slate-700">{u.active_days}</span><span class="text-xs text-slate-400">/30</span>
							<div class="mt-1 ml-auto h-1 w-12 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full bg-brand-500" style="width:{(u.active_days / 30) * 100}%"></div></div>
						</td>
						<td class="whitespace-nowrap" data-label="Terakhir rekap">
							{#if days === null}
								<span class="text-xs text-rose-600">Belum pernah</span>
							{:else}
								<div class="text-sm">{fmtDate(u.last_at)}</div>
								<div class="text-xs {days >= 7 ? 'text-rose-600' : 'text-slate-400'}">{daysAgoLabel(days)}</div>
							{/if}
						</td>
						<td data-label="Status">
							<Badge cls={USER_STATUS[u.status].cls} dot>{u.status === 'approved' ? 'Aktif' : USER_STATUS[u.status].label}</Badge>
							{#if u.status_note}<div class="mt-1 max-w-48 text-xs text-slate-500">{u.status_note}</div>{/if}
						</td>
						<td data-cell="actions"><div class="flex flex-wrap justify-end gap-1.5"><a href="/admin/members/{u.id}" class="btn btn-soft-brand btn-sm" title="Lihat detail user"><Eye /> Detail</a><UserActions {u} compact /></div></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<Pagination current={data.page} total={data.total} perPage={data.perPage} />
{:else}
	<EmptyState icon={SearchX} title="Tidak ada user" description="Tidak ada user terverifikasi yang cocok dengan pencarian." />
{/if}
