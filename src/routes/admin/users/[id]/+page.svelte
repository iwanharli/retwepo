<script>
	import { toastResult } from '#lib/toast.svelte.js';
	import { enhance } from '$app/forms';
	import { invalidate, invalidateAll } from '$app/navigation';
	import { USER_STATUS, ACCOUNT_STATUS, fmtDate, fmtNum } from '#lib/constants.js';
	import Badge from '#lib/components/Badge.svelte';
	import Stat from '#lib/components/Stat.svelte';
	import Chart from '#lib/components/Chart.svelte';
	import PlatformTag from '#lib/components/PlatformTag.svelte';
	import RecapCard from '#lib/components/RecapCard.svelte';
	import RangeFilter from '#lib/components/RangeFilter.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import Flash from '#lib/components/Flash.svelte';
	import UserActions from '#lib/components/UserActions.svelte';
	import SortTh from '#lib/components/SortTh.svelte';
	import ActionDialog from '#lib/components/ActionDialog.svelte';
	import AddAccountDialog from '#lib/components/AddAccountDialog.svelte';
	import EditUserDialog from '#lib/components/EditUserDialog.svelte';
	import EwalletCheck from '#lib/components/EwalletCheck.svelte';
	import AccountSummary from '#lib/components/AccountSummary.svelte';
	import { Check, X, ShieldX, CalendarDays, FileText, Reply, Clock, Layers } from '@lucide/svelte';

	let { data, form } = $props();
	const u = $derived(data.u);
	const st = $derived(data.stats);

	// tabel akun: diurutkan di sisi klien (datanya sedikit & dimuat sekaligus)
	let accSort = $state({ key: 'created_at', dir: 'asc' });
	const sortAccounts = (key, dir) => (accSort = { key, dir });
	const accounts = $derived.by(() => {
		const { key, dir } = accSort;
		const val = (a) => (key.endsWith('_at') ? (a[key] ? new Date(a[key]).getTime() : null) : typeof a[key] === 'string' ? a[key].toLowerCase() : a[key]);
		return [...st.perAccount].sort((a, b) => {
			const x = val(a), y = val(b);
			if (x === y) return 0;
			if (x === null) return 1; // kosong selalu di akhir
			if (y === null) return -1;
			return (x < y ? -1 : 1) * (dir === 'asc' ? 1 : -1);
		});
	});

	const after = () => async ({ update }) => {
		await update();
		invalidate('app:pending');
	};
	// setujui: notifikasi dengan tombol Batalkan
	const approved = () => async ({ result, update }) => {
		if (result.type === 'success') {
			await invalidateAll();
			toastResult(result);
		} else await update();
	};

	const trend = $derived({
		tooltip: { trigger: 'axis' },
		legend: { top: 0 },
		grid: { left: 30, right: 10, top: 30, bottom: 24 },
		xAxis: { type: 'category', data: st.days.map((d) => d.slice(5)) },
		yAxis: { type: 'value', minInterval: 1 },
		series: [
			{ name: 'Postingan', type: 'bar', stack: 't', data: st.series.post, itemStyle: { color: '#6366f1' } },
			{ name: 'Panel', type: 'bar', stack: 't', data: st.series.reply, itemStyle: { color: '#38bdf8' } }
		]
	});
</script>

<svelte:head><title>{u.nickname ?? u.email} · Admin Retwepo</title></svelte:head>

{#if ['approved', 'suspended'].includes(u.status)}
	<a href="/admin/members" class="text-sm text-slate-500 hover:underline">← User terverifikasi</a>
{:else}
	<a href="/admin/users" class="text-sm text-slate-500 hover:underline">← Pendaftaran user</a>
{/if}

<div class="mt-2 mb-6 flex flex-wrap items-start justify-between gap-4">
	<div class="flex items-center gap-4">
		{#if u.avatarUrl}
			<img src={u.avatarUrl} alt="" class="h-14 w-14 rounded-full" referrerpolicy="no-referrer" />
		{:else}
			<div class="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-700">
				{(u.nickname ?? u.email)[0].toUpperCase()}
			</div>
		{/if}
		<div>
			<h1 class="flex items-center gap-2 text-2xl font-bold">
				{u.nickname ?? '—'}
				<Badge cls={USER_STATUS[u.status].cls}>{USER_STATUS[u.status].label}</Badge>
				{#if u.role === 'admin'}<Badge cls="bg-indigo-100 text-indigo-700">admin</Badge>{/if}
			</h1>
			<div class="text-sm text-slate-500">{u.email}</div>
			<div class="text-sm text-slate-500">
				{u.ewalletProvider ?? '-'} · <span class="font-mono">{u.ewalletNumber ?? '-'}</span>
			</div>
			<EwalletCheck {u} check={data.ewalletCheck} engine={data.ewalletEngine} canRecheck={u.id !== data.meId} />
		</div>
	</div>
	<div class="flex flex-wrap items-center gap-1.5">
		{#if u.status !== 'incomplete' && u.id !== data.meId}<EditUserDialog {u} />{/if}
		<UserActions {u} />
	</div>
</div>

<Flash {form} />

{#if u.statusNote}
	<div class="mb-4 rounded-lg bg-slate-100 px-4 py-2 text-sm">Catatan status: {u.statusNote}</div>
{/if}

<div class="mb-4 text-xs text-slate-500">
	Login pertama {fmtDate(u.createdAt, true)} · daftar {fmtDate(u.registeredAt, true)} ·
	ditinjau {fmtDate(u.reviewedAt, true)}{data.reviewer ? ` oleh ${data.reviewer}` : ''}
</div>

<div class="card mb-6 overflow-x-auto p-0">
	<div class="flex items-center justify-between gap-3 px-5 pt-4">
		<div class="font-semibold">Akun media sosial</div>
		{#if u.status === 'approved'}<AddAccountDialog user={{ ...u, accounts: st.perAccount.filter((a) => a.status === 'approved') }} triggerClass="btn btn-soft-brand btn-sm" />{/if}
	</div>
	<table class="table table-cards mt-2">
		<thead>
			<tr>
				<SortTh key="username" label="Akun" sort={accSort} onsort={sortAccounts} />
				<SortTh key="status" label="Status" sort={accSort} onsort={sortAccounts} />
				<SortTh key="in_range" label="Rekap (periode / total)" sort={accSort} onsort={sortAccounts} defaultDir="desc" align="right" />
				<SortTh key="last_at" label="Terakhir" sort={accSort} onsort={sortAccounts} defaultDir="desc" />
				<SortTh key="created_at" label="Diajukan" sort={accSort} onsort={sortAccounts} defaultDir="desc" />
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each accounts as a (a.id)}
				<tr>
					<td data-label=""><a href="/admin/social/{a.id}" class="hover:underline"><PlatformTag platform={a.platform} username={a.username} /></a></td>
					<td data-label="Status">
						<Badge cls={ACCOUNT_STATUS[a.status].cls}>{ACCOUNT_STATUS[a.status].label}</Badge>
						{#if a.status_note}<div class="text-xs text-slate-500">{a.status_note}</div>{/if}
					</td>
					<td class="text-right" data-label="Rekap (periode / total)">{fmtNum(a.in_range)} / {fmtNum(a.total)}</td>
					<td class="text-slate-500" data-label="Terakhir">{fmtDate(a.last_at)}</td>
					<td class="text-slate-500" data-label="Diajukan">{fmtDate(a.created_at)}</td>
					<td class="text-right" data-cell="actions">
						<div class="flex justify-end gap-1.5">
							{#if a.status !== 'approved'}
								<form method="POST" action="?/approveAccount" use:enhance={approved}>
									<input type="hidden" name="id" value={a.id} /><button class="btn btn-success btn-sm" aria-label="Setujui akun" title="Setujui akun"><Check /></button>
								</form>
							{/if}
							{#if a.status !== 'rejected'}
								<ActionDialog
									action="rejectAccount"
									fields={{ id: a.id }}
									tone="danger"
									icon={ShieldX}
									title={a.status === 'approved' ? 'Cabut verifikasi akun?' : 'Tolak akun ini?'}
									description="Pemilik akun akan melihat alasan ini. Username yang ditolak bisa didaftarkan ulang."
									confirmLabel={a.status === 'approved' ? 'Cabut verifikasi' : 'Tolak akun'}
									note={{ label: 'Alasan', presets: ['Username tidak ditemukan', 'Akun bukan milik user ini', 'Akun sudah tidak dipakai'], hint: 'Ditampilkan kepada pemilik akun.' , required: true }}
									triggerClass="btn btn-soft-danger btn-sm"
									triggerLabel="Tolak akun"
								>
									{#snippet trigger()}<X />{/snippet}
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

<div class="mb-4 flex flex-wrap items-end justify-between gap-3">
	<h2 class="text-lg font-semibold">Aktivitas</h2>
	<RangeFilter from={data.range.from} to={data.range.to} />
</div>

<div class="grid grid-cols-2 gap-4 lg:grid-cols-5">
	<Stat label="Rekap periode" desc="Rekap pada rentang tanggal terpilih" value={st.summary.in_range} icon={CalendarDays} tone="brand" hint="{data.range.days} hari" />
	<Stat label="Postingan" desc="Konten yang diunggah sendiri" value={st.summary.posts} icon={FileText} tone="violet" />
	<Stat label="Panel" desc="Reply, like, retweet & share" value={st.summary.replies} icon={Reply} tone="sky" />
	<Stat label="Hari aktif" desc="Hari dengan minimal 1 rekap" value="{st.summary.active_days} / {data.range.days}" icon={Clock} tone="emerald" />
	<Stat label="Total semua" desc="Seluruh rekap user ini" value={st.summary.total} hint="pertama {fmtDate(st.summary.first_at)}" icon={Layers} tone="amber" />
</div>

<div class="card mt-6">
	<Chart option={trend} height="260px" />
</div>

<div class="mt-6 mb-3 flex items-center justify-between">
	<h2 class="text-lg font-semibold">Rekap</h2>
	<a href="/admin/recaps?user={u.id}" class="text-sm text-indigo-600 hover:underline">Filter di galeri →</a>
</div>
{#if data.recent.rows.length}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each data.recent.rows as r (r.id)}<RecapCard {r} href="/admin/recaps/{r.id}" />{/each}
	</div>
	<Pagination current={data.recent.page} total={data.recent.total} perPage={data.recent.perPage} />
{:else}
	<div class="card text-center text-sm text-slate-500">Belum ada rekap.</div>
{/if}
