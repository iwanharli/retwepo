<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { ArrowLeft, ExternalLink, Check, ShieldOff, ShieldX, History, Images, Layers, FileText, Reply, CalendarDays, Clock, UserRound, Eye } from '@lucide/svelte';
	import { PLATFORMS, ACCOUNT_STATUS, USER_STATUS, fmtDate, fmtNum, adminUserHref } from '#lib/constants.js';
	import { toastResult } from '#lib/toast.svelte.js';
	import PlatformIcon from '#lib/components/PlatformIcon.svelte';
	import Badge from '#lib/components/Badge.svelte';
	import Avatar from '#lib/components/Avatar.svelte';
	import Stat from '#lib/components/Stat.svelte';
	import Chart from '#lib/components/Chart.svelte';
	import RangeFilter from '#lib/components/RangeFilter.svelte';
	import RecapCard from '#lib/components/RecapCard.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import ActionDialog from '#lib/components/ActionDialog.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Flash from '#lib/components/Flash.svelte';

	let { data, form } = $props();
	const a = $derived(data.account);
	const s = $derived(data.summary);
	const p = $derived(PLATFORMS[a.platform]);

	const LOG = {
		approveAccount: ['Disetujui', 'bg-emerald-500'],
		addAccount: ['Ditambahkan admin (langsung terverifikasi)', 'bg-emerald-500'],
		rejectAccount: ['Ditolak', 'bg-rose-500'],
		revokeAccount: ['Verifikasi dicabut', 'bg-rose-500'],
		undoApproveAccount: ['Persetujuan dibatalkan', 'bg-slate-400']
	};

	const approved = () => async ({ result, update }) => {
		if (result.type === 'success') {
			await invalidateAll();
			toastResult(result);
		} else await update();
	};

	const trend = $derived({
		tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
		legend: { top: 0, right: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
		grid: { left: 8, right: 8, top: 36, bottom: 4, containLabel: true },
		xAxis: { type: 'category', data: data.days.map((d) => d.slice(8) + '/' + d.slice(5, 7)), axisTick: { show: false }, axisLabel: { color: '#94a3b8' } },
		yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#94a3b8' } },
		series: [
			{ name: 'Postingan', type: 'bar', stack: 't', barMaxWidth: 22, data: data.series.post, itemStyle: { color: '#6366f1' } },
			{ name: 'Panel', type: 'bar', stack: 't', barMaxWidth: 22, data: data.series.reply, itemStyle: { color: '#38bdf8', borderRadius: [4, 4, 0, 0] } }
		]
	});
	const ACC_PRESETS = ['Username tidak ditemukan', 'Akun bukan milik user ini', 'Akun sudah tidak dipakai', 'Melanggar ketentuan'];
</script>

<svelte:head><title>@{a.username} · Admin Retwepo</title></svelte:head>

<a href={a.status === 'approved' ? '/admin/social' : '/admin/accounts'} class="btn btn-ghost -ml-3 mb-4">
	<ArrowLeft /> {a.status === 'approved' ? 'Akun terverifikasi' : 'Pengajuan akun'}
</a>
<Flash {form} />

<!-- Profil akun -->
<section class="card mb-6 p-0">
	<div class="flex flex-wrap items-center gap-5 p-6">
		<PlatformIcon platform={a.platform} size={64} class="rounded-2xl" />
		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap items-center gap-2">
				<a href={p.profile(a.username)} target="_blank" rel="noopener" class="flex items-center gap-1.5 text-2xl font-semibold tracking-tight hover:text-brand-600">
					@{a.username}<ExternalLink class="size-4 text-slate-400" />
				</a>
				<Badge cls={ACCOUNT_STATUS[a.status].cls} dot>{ACCOUNT_STATUS[a.status].label}</Badge>
			</div>
			<p class="mt-1 text-sm text-slate-500">
				{p.label} · diajukan {fmtDate(a.created_at, true)}{a.reviewed_at ? ` · ditinjau ${fmtDate(a.reviewed_at, true)}${a.reviewer ? ` oleh ${a.reviewer}` : ''}` : ''}
			</p>
			{#if a.status_note}<p class="mt-2 text-sm text-rose-700"><b>Alasan:</b> {a.status_note}</p>{/if}
		</div>
		<div class="flex flex-wrap gap-2">
			<a href="/admin/recaps?q={encodeURIComponent(a.username)}&from=&to=" class="btn btn-soft-brand"><Images /> Semua rekap</a>
			{#if a.status !== 'approved'}
				<form method="POST" action="?/approveAccount" use:enhance={approved}>
					<input type="hidden" name="id" value={a.id} />
					<button class="btn btn-success"><Check /> Setujui</button>
				</form>
			{/if}
			{#if a.status !== 'rejected'}
				<ActionDialog
					action="rejectAccount"
					fields={{ id: a.id }}
					tone="danger"
					icon={a.status === 'approved' ? ShieldOff : ShieldX}
					title={a.status === 'approved' ? 'Cabut verifikasi akun?' : 'Tolak akun ini?'}
					description="Pemilik akun akan melihat alasan ini. Username yang ditolak bisa didaftarkan ulang. Rekap lama tetap tersimpan."
					confirmLabel={a.status === 'approved' ? 'Cabut verifikasi' : 'Tolak akun'}
					note={{ label: 'Alasan', presets: ACC_PRESETS, hint: 'Ditampilkan kepada pemilik akun.', required: true }}
					triggerClass="btn btn-soft-danger"
				>
					{#snippet trigger()}{#if a.status === 'approved'}<ShieldOff /> Cabut{:else}<ShieldX /> Tolak{/if}{/snippet}
					<div class="text-sm"><b>@{a.username}</b> · {p.label} · milik {a.owner_nickname ?? a.owner_email}</div>
				</ActionDialog>
			{/if}
		</div>
	</div>
	<!-- pemilik -->
	<div class="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
		<UserRound class="size-4 text-slate-400" />
		<span class="text-sm text-slate-500">Pemilik</span>
		<Avatar user={{ nickname: a.owner_nickname, email: a.owner_email, avatarUrl: a.owner_avatar }} size={28} />
		<span class="text-sm font-medium">{a.owner_nickname ?? '—'}</span>
		<span class="truncate text-sm text-slate-500">{a.owner_email}</span>
		{#if a.owner_status !== 'approved'}<Badge cls={USER_STATUS[a.owner_status].cls}>{USER_STATUS[a.owner_status].label}</Badge>{/if}
	<a href={adminUserHref(a.owner_id, a.owner_status)} class="btn btn-soft-brand btn-sm shrink-0" title="Lihat detail"><Eye /> Detail user</a></div>
</section>

<!-- Statistik -->
<div class="mb-4 flex flex-wrap items-end justify-between gap-3">
	<h2 class="text-lg font-semibold">Aktivitas rekap</h2>
	<RangeFilter from={data.range.from} to={data.range.to} />
</div>
<div class="grid grid-cols-2 gap-4 lg:grid-cols-5 lg:gap-6">
	<Stat label="Rekap periode" desc="Rekap pada rentang tanggal terpilih" value={s.in_range} icon={CalendarDays} tone="brand" hint="{data.range.days} hari" />
	<Stat label="Postingan" desc="Konten yang diunggah sendiri" value={s.posts} icon={FileText} tone="violet" />
	<Stat label="Panel" desc="Reply, like, retweet & share" value={s.replies} icon={Reply} tone="sky" />
	<Stat label="Hari aktif" desc="Hari dengan minimal 1 rekap" value="{s.active_days} / {data.range.days}" icon={Clock} tone="emerald" />
	<Stat label="Total semua" desc="Seluruh rekap akun ini" value={s.total} icon={Layers} tone="amber" hint={s.deleted ? `${s.deleted} dihapus admin (tidak dihitung)` : `sejak ${fmtDate(s.first_at)}`} />
</div>

<div class="mt-6 grid gap-6 xl:grid-cols-3">
	<div class="card p-0 xl:col-span-2">
		<div class="card-header"><div class="card-title">Rekap per hari</div><span class="text-xs text-slate-500">terakhir {fmtDate(s.last_at, true)}</span></div>
		<div class="p-5"><Chart option={trend} height="300px" /></div>
	</div>

	<!-- Riwayat verifikasi -->
	<div class="card p-0">
		<div class="card-header"><div class="card-title"><History /> Riwayat verifikasi</div></div>
		<ol class="p-5">
			{#each data.history as h, i (h.id)}
				{@const [label, dot] = LOG[h.action] ?? [h.action, 'bg-slate-400']}
				<li class="relative pb-5 pl-6 last:pb-0">
					{#if i < data.history.length - 1}<span class="absolute top-3 bottom-0 left-[5px] w-px bg-slate-200"></span>{/if}
					<span class="absolute top-1.5 left-0 size-[11px] rounded-full ring-4 ring-white {dot}"></span>
					<div class="text-sm font-medium text-slate-900">{label}</div>
					<div class="text-xs text-slate-500">{fmtDate(h.created_at, true)} · {h.admin_nickname ?? h.admin_email ?? 'Sistem'}</div>
					{#if h.note}<p class="mt-1 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600">{h.note}</p>{/if}
				</li>
			{:else}
				<li class="text-sm text-slate-500">
					Belum ada catatan di log.{' '}{#if a.status === 'approved'} Akun ini disetujui {a.reviewed_at ? fmtDate(a.reviewed_at, true) : ''} (sebelum log aktivitas tersedia atau bersama persetujuan pendaftaran user).{/if}
				</li>
			{/each}
		</ol>
	</div>
</div>

<!-- Rekap terbaru -->
<div class="mt-8 mb-4 flex items-center justify-between">
	<h2 class="text-lg font-semibold">Rekap akun ini</h2>
	<a href="/admin/recaps?q={encodeURIComponent(a.username)}&from=&to=" class="btn btn-ghost btn-sm"><Images /> Buka di Semua Rekap</a>
</div>
{#if data.recent.rows.length}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 2xl:grid-cols-4">
		{#each data.recent.rows as r (r.id)}<RecapCard {r} href="/admin/recaps/{r.id}" />{/each}
	</div>
	<Pagination current={data.recent.page} total={data.recent.total} perPage={data.recent.perPage} />
{:else}
	<EmptyState icon={Images} title="Belum ada rekap" description="Akun ini belum pernah dipakai untuk merekap." />
{/if}
