<script>
	import { BadgeCheck, SearchX, ShieldOff, Images, UserCheck, Ban, Users, Eye, ChevronDown, ChevronsUpDown, ChevronsDownUp, Wallet } from '@lucide/svelte';
	import { page } from '$app/state';
	import { USER_STATUS, fmtDate, fmtNum, adminUserHref } from '#lib/constants.js';
	import Badge from '#lib/components/Badge.svelte';
	import Avatar from '#lib/components/Avatar.svelte';
	import PlatformTag from '#lib/components/PlatformTag.svelte';
	import PlatformIcon from '#lib/components/PlatformIcon.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import Flash from '#lib/components/Flash.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import AccountListToolbar from '#lib/components/AccountListToolbar.svelte';
	import FilterTabs from '#lib/components/FilterTabs.svelte';
	import FilterSelect from '#lib/components/FilterSelect.svelte';
	import ActionDialog from '#lib/components/ActionDialog.svelte';
	import AddAccountDialog from '#lib/components/AddAccountDialog.svelte';
	import ExportLink from '#lib/components/ExportLink.svelte';
	import AccountSummary from '#lib/components/AccountSummary.svelte';

	let { data, form } = $props();

	// grup yang sedang terbuka; saat mencari, semua grup otomatis terbuka
	let open = $state(new Set());
	const isOpen = (id) => Boolean(data.f.q) || open.has(id);
	function toggle(id) {
		const s = new Set(open);
		s.has(id) ? s.delete(id) : s.add(id);
		open = s;
	}
	const allOpen = $derived(data.groups.length > 0 && data.groups.every((g) => open.has(g.user_id)));
	const toggleAll = () => (open = allOpen ? new Set() : new Set(data.groups.map((g) => g.user_id)));

	const SORTS = [['month', 'Rekap 30 hari'], ['total', 'Total rekap'], ['last', 'Terakhir rekap'], ['accounts', 'Jumlah akun'], ['owner', 'Nama']];
	const DAY = 86400000;
	const idle = (d) => (d ? Math.floor((Date.now() - new Date(d)) / DAY) : null);
</script>

<svelte:head><title>Akun Terverifikasi · Admin Retwepo</title></svelte:head>

{#snippet lastUsed(d)}
	{@const days = idle(d)}
	{#if days === null}
		<span class="text-xs text-rose-600">Belum pernah</span>
	{:else}
		<div class="text-sm">{fmtDate(d)}</div>
		<div class="text-xs {days >= 7 ? 'text-rose-600' : 'text-slate-400'}">{days === 0 ? 'hari ini' : `${days} hari lalu`}</div>
	{/if}
{/snippet}

<PageHeader
	title="Akun Sosmed Terverifikasi"
	description={data.owner === 'suspended'
		? `${fmtNum(data.accounts)} akun dari ${fmtNum(data.total)} user yang sedang ditangguhkan — tidak bisa dipakai rekap sampai pemiliknya diaktifkan.`
		: `${fmtNum(data.accounts)} akun terverifikasi dari ${fmtNum(data.total)} user${data.owner === 'all' ? '' : ' aktif'}.`}
	icon={BadgeCheck}
>
	{#snippet actions()}
		<ExportLink params={{ type: 'accounts', q: data.f.q, platform: data.f.platform, status: ['approved'] }} />
		<AddAccountDialog />
	{/snippet}
</PageHeader>

<!-- status pemilik akun -->
<FilterTabs
	param="owner"
	current={data.owner === 'approved' ? null : data.owner}
	items={[
		{ value: null, label: 'Pemilik aktif', count: data.ownerCounts.approved, icon: UserCheck },
		{ value: 'suspended', label: 'Pemilik ditangguhkan', count: data.ownerCounts.suspended, icon: Ban, alert: 'amber' },
		{ value: 'all', label: 'Semua', count: data.ownerCounts.all, icon: Users }
	]}
/>

<AccountListToolbar f={data.f} extra={['sort', 'dir']} uncounted={['sort', 'dir']}>
	<FilterSelect name="sort" value={data.f.sort.key === 'month' ? '' : data.f.sort.key} all="Urut: rekap 30 hari" label="Urutkan" options={SORTS.filter(([k]) => k !== 'month').map(([k, l]) => [k, `Urut: ${l.toLowerCase()}`])} />
</AccountListToolbar>
<Flash {form} />

{#if data.groups.length}
	<!-- urutan & buka/tutup semua -->
	<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
		<span class="text-sm text-slate-500">{fmtNum(data.total)} user · {fmtNum(data.accounts)} akun</span>
		{#if !data.f.q}
			<button type="button" class="btn btn-secondary btn-sm" onclick={toggleAll}>
				{#if allOpen}<ChevronsDownUp /> Tutup semua{:else}<ChevronsUpDown /> Buka semua{/if}
			</button>
		{/if}
	</div>

	<div class="space-y-3">
		{#each data.groups as g (g.user_id)}
			{@const expanded = isOpen(g.user_id)}
			<section class="card overflow-hidden p-0 transition {expanded ? 'ring-2 ring-brand-500/15' : ''}">
				<!-- kepala grup: info pemilik -->
				<div class="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4">
					<button type="button" class="flex min-w-0 flex-1 items-center gap-3 text-left" onclick={() => toggle(g.user_id)} aria-expanded={expanded}>
						<ChevronDown class="size-5 shrink-0 text-slate-400 transition {expanded ? '' : '-rotate-90'}" />
						<Avatar user={{ nickname: g.nickname, email: g.email, avatarUrl: g.avatar_url }} size={40} />
						<span class="min-w-0">
							<span class="flex items-center gap-2 font-semibold text-slate-900">
								<span class="truncate">{g.nickname ?? g.email}</span>
								{#if g.user_status !== 'approved'}<Badge cls={USER_STATUS[g.user_status].cls}>{USER_STATUS[g.user_status].label}</Badge>{/if}
							</span>
							<span class="block truncate text-xs text-slate-500">{g.email}</span>
						</span>
					</button>
					<div class="flex items-center -space-x-1.5">
						{#each g.accounts.slice(0, 6) as a}<span title="@{a.username}" class="rounded-full ring-2 ring-white"><PlatformIcon platform={a.platform} size={26} class="rounded-full" /></span>{/each}
						{#if g.accounts.length > 6}<span class="flex size-[26px] items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 ring-2 ring-white">+{g.accounts.length - 6}</span>{/if}
					</div>
					<dl class="grid grid-cols-4 gap-5 text-sm">
						<div><dt class="text-xs text-slate-500">Akun</dt><dd class="font-semibold">{fmtNum(g.n)}</dd></div>
						<div><dt class="text-xs text-slate-500">30 hari</dt><dd class="text-base font-semibold">{fmtNum(g.month)}</dd></div>
						<div><dt class="text-xs text-slate-500">Total</dt><dd class="text-slate-600">{fmtNum(g.total)}</dd></div>
						<div class="whitespace-nowrap"><dt class="text-xs text-slate-500">Terakhir</dt><dd>{@render lastUsed(g.last_at)}</dd></div>
					</dl>
					<a href={adminUserHref(g.user_id, g.user_status)} class="btn btn-soft-brand btn-sm"><Eye /> Detail user</a>
				</div>

				<!-- isi grup: akun-akun milik user -->
				{#if expanded}
					<div class="overflow-x-auto border-t border-slate-100 bg-slate-50/40">
						<table class="table table-cards">
							<thead>
								<tr>
									<th>Akun</th>
									<th class="text-right">Rekap 30 hari</th>
									<th class="text-right">Total</th>
									<th>Terakhir dipakai</th>
									<th>Disetujui</th>
									<th class="text-right">Aksi</th>
								</tr>
							</thead>
							<tbody>
								{#each g.accounts as a (a.id)}
									<tr class="hover:bg-white">
										<td data-label=""><PlatformTag platform={a.platform} username={a.username} size={28} /></td>
										<td class="text-right text-base font-semibold" data-label="Rekap 30 hari">{fmtNum(a.month)}</td>
										<td class="text-right text-slate-500" data-label="Total">{fmtNum(a.total)}</td>
										<td class="whitespace-nowrap" data-label="Terakhir dipakai">{@render lastUsed(a.last_at)}</td>
										<td class="whitespace-nowrap text-slate-500" data-label="Disetujui">{fmtDate(a.reviewed_at ?? a.created_at)}</td>
										<td data-cell="actions">
											<div class="flex justify-end gap-1.5">
												<a href="/admin/social/{a.id}" class="btn btn-soft-brand btn-sm" title="Detail akun"><Eye /> Detail</a>
												<a href="/admin/recaps?q={encodeURIComponent(a.username)}&from=&to=" class="btn btn-secondary btn-sm" title="Lihat rekap akun ini"><Images /> Rekap</a>
												<ActionDialog
													action="rejectAccount"
													fields={{ id: a.id }}
													tone="danger"
													icon={ShieldOff}
													title="Cabut verifikasi akun?"
													description="Akun tidak bisa dipakai untuk rekap lagi dan username-nya bisa didaftarkan user lain. Rekap lama tetap tersimpan."
													confirmLabel="Cabut verifikasi"
													note={{ label: 'Alasan pencabutan', presets: ['Akun sudah tidak dipakai', 'Akun bukan milik user ini', 'Melanggar ketentuan'], hint: 'Ditampilkan kepada pemilik akun.', required: true }}
													triggerClass="btn btn-soft-danger btn-sm"
												>
													{#snippet trigger()}<ShieldOff /> Cabut{/snippet}
													<AccountSummary accounts={[{ ...a, nickname: g.nickname, email: g.email }]} />
													<p class="mt-2.5 border-t border-slate-200 pt-2.5 text-xs text-slate-500">{fmtNum(a.total)} rekap tercatat dari akun ini.</p>
												</ActionDialog>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</section>
		{/each}
	</div>
	<Pagination current={data.page} total={data.total} perPage={data.perPage} />
{:else}
	<EmptyState icon={SearchX} title="Tidak ada akun" description="Tidak ada akun terverifikasi yang cocok dengan filter." />
{/if}
