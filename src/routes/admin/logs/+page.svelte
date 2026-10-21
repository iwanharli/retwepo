<script>
	import {
		ScrollText,
		Inbox,
		UserCheck,
		UserX,
		Ban,
		RotateCcw,
		ShieldCheck,
		ShieldOff,
		BadgeCheck,
		ShieldX,
		Trash2,
		Undo2,
		MessageSquareQuote,
		Eraser,
		Bot,
		UserPlus,
		UserPen,
		Megaphone
	} from '@lucide/svelte';
	import { fmtDate, fmtNum, adminUserHref } from '#lib/constants.js';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import RangeFilter from '#lib/components/RangeFilter.svelte';
	import FilterSelect from '#lib/components/FilterSelect.svelte';
	import Avatar from '#lib/components/Avatar.svelte';

	let { data } = $props();

	// ikon & warna per jenis aksi
	const STYLE = {
		approveUser: [UserCheck, 'bg-emerald-50 text-emerald-600 ring-emerald-200'],
		rejectUser: [UserX, 'bg-rose-50 text-rose-600 ring-rose-200'],
		suspendUser: [Ban, 'bg-amber-50 text-amber-600 ring-amber-200'],
		reactivateUser: [RotateCcw, 'bg-emerald-50 text-emerald-600 ring-emerald-200'],
		grantAdmin: [ShieldCheck, 'bg-brand-50 text-brand-600 ring-brand-200'],
		revokeAdmin: [ShieldOff, 'bg-rose-50 text-rose-600 ring-rose-200'],
		approveAccount: [BadgeCheck, 'bg-emerald-50 text-emerald-600 ring-emerald-200'],
		rejectAccount: [ShieldX, 'bg-rose-50 text-rose-600 ring-rose-200'],
		revokeAccount: [ShieldOff, 'bg-rose-50 text-rose-600 ring-rose-200'],
		deleteRecap: [Trash2, 'bg-rose-50 text-rose-600 ring-rose-200'],
		undoApproveUser: [Undo2, 'bg-slate-100 text-slate-600 ring-slate-200'],
		undoApproveAccount: [Undo2, 'bg-slate-100 text-slate-600 ring-slate-200'],
		restoreRecap: [RotateCcw, 'bg-emerald-50 text-emerald-600 ring-emerald-200'],
		purgeRecaps: [Eraser, 'bg-slate-100 text-slate-600 ring-slate-200'],
		createUser: [UserPlus, 'bg-brand-50 text-brand-600 ring-brand-200'],
		addAccount: [BadgeCheck, 'bg-emerald-50 text-emerald-600 ring-emerald-200'],
		editUserProfile: [UserPen, 'bg-brand-50 text-brand-600 ring-brand-200'],
		createCampaign: [Megaphone, 'bg-violet-50 text-violet-600 ring-violet-200'],
		renameCampaign: [Megaphone, 'bg-violet-50 text-violet-600 ring-violet-200'],
		closeCampaign: [Megaphone, 'bg-slate-100 text-slate-600 ring-slate-200'],
		openCampaign: [Megaphone, 'bg-emerald-50 text-emerald-600 ring-emerald-200'],
		announce: [Megaphone, 'bg-brand-50 text-brand-600 ring-brand-200'],
		approveRename: [BadgeCheck, 'bg-emerald-50 text-emerald-600 ring-emerald-200'],
		rejectRename: [ShieldX, 'bg-rose-50 text-rose-600 ring-rose-200']
	};
	// aksi yang belum punya gaya khusus tetap tampil dengan ikon umum
	const styleOf = (k) => STYLE[k] ?? [ScrollText, 'bg-slate-100 text-slate-600 ring-slate-200'];

	const targetHref = (l) => (l.target_type === 'user' && l.target_user_status ? adminUserHref(l.target_id, l.target_user_status) : null);
</script>

<svelte:head><title>Log Aktivitas · Admin Retwepo</title></svelte:head>

<PageHeader title="Log Aktivitas" description="Catatan setiap aksi admin: siapa, kapan, terhadap apa, dan alasannya." icon={ScrollText} />
<RangeFilter from={data.f.from} to={data.f.to} extra={['action']} search={{ value: data.f.q, placeholder: 'Cari nama admin, target (user / akun / rekap), atau alasan…' }}>
	<FilterSelect
		name="action"
		value={data.f.action ?? ''}
		all="Semua aksi"
		label="Jenis aksi"
		options={Object.entries(data.actions)
			.filter(([k]) => data.counts[k] || k === data.f.action)
			.map(([k, label]) => [k, `${label} (${data.counts[k] ?? 0})`])}
	/>
</RangeFilter>

{#if data.rows.length}
	<div class="card p-0">
		<ol class="divide-y divide-slate-100">
			{#each data.rows as l (l.id)}
				{@const [Icon, cls] = styleOf(l.action)}
				{@const href = targetHref(l)}
				<li class="flex gap-4 px-5 py-4">
					<span class="flex size-9 shrink-0 items-center justify-center rounded-full ring-1 {cls}"><Icon class="size-4" /></span>
					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
							<p class="text-sm">
								<span class="inline-flex items-center gap-1.5 align-middle font-medium text-slate-900">
									{#if l.admin_id}
										<Avatar user={{ nickname: l.admin_nickname, email: l.admin_email, avatarUrl: l.admin_avatar }} size={18} />
										{l.admin_nickname ?? l.admin_email ?? 'Admin terhapus'}
									{:else}
										<span class="flex size-[18px] items-center justify-center rounded-full bg-slate-200 text-slate-600"><Bot class="size-3" /></span> Sistem
									{/if}
								</span>
								<span class="text-slate-500">{(data.actions[l.action] ?? l.action).toLowerCase()}</span>
								{#if href}
									<a {href} class="font-medium text-brand-700 hover:underline">{l.target_label}</a>
								{:else}
									<span class="font-medium text-slate-800">{l.target_label}</span>
								{/if}
							</p>
							<time class="shrink-0 text-xs text-slate-500">{fmtDate(l.created_at, true)}</time>
						</div>
						{#if l.note}
							<p class="mt-2 flex gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-100">
								<MessageSquareQuote class="mt-0.5 size-4 shrink-0 text-slate-400" />{l.note}
							</p>
						{/if}
						{#if l.action === 'editUserProfile' && l.meta?.changed}
							<ul class="mt-1.5 space-y-0.5 text-xs text-slate-600">
								{#each l.meta.changed as k}
									<li><span class="text-slate-400">{({ nickname: 'Nama', ewalletProvider: 'E-wallet', ewalletNumber: 'Nomor' })[k]}:</span> <span class="line-through opacity-60">{l.meta.before[k] ?? '—'}</span> → <b>{l.meta.after[k] ?? '—'}</b></li>
								{/each}
							</ul>
						{/if}
						{#if l.action === 'deleteRecap' && l.meta?.url}
							<p class="mt-1.5 truncate text-xs text-slate-500">URL rekap: {l.meta.url}</p>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	</div>
	<Pagination current={data.page} total={data.total} perPage={data.perPage} />
{:else}
	<EmptyState icon={Inbox} title="Belum ada aktivitas" description="Tidak ada aksi admin yang tercatat pada rentang dan filter ini." />
{/if}
