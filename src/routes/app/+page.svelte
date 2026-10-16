<script>
	import {
		Plus,
		CalendarCheck,
		CalendarRange,
		CalendarDays,
		Layers,
		ArrowRight,
		Inbox,
		Link2,
		Flame,
		FileText,
		Reply,
		Trash2
	} from '@lucide/svelte';
	import Stat from '#lib/components/Stat.svelte';
	import Chart from '#lib/components/Chart.svelte';
	import RecapCard from '#lib/components/RecapCard.svelte';
	import PlatformIcon from '#lib/components/PlatformIcon.svelte';
	import Badge from '#lib/components/Badge.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import ReadinessAlert from '#lib/components/ReadinessAlert.svelte';
	import { ACCOUNT_STATUS, PLATFORMS, fmtDate, fmtNum } from '#lib/constants.js';

	let { data } = $props();
	const c = $derived(data.counts);
	const canRecap = $derived(!data.missingProfile.length && data.perAccount.some((a) => a.status === 'approved'));

	const hour = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false });
	const greet = +hour < 11 ? 'Selamat pagi' : +hour < 15 ? 'Selamat siang' : +hour < 18 ? 'Selamat sore' : 'Selamat malam';

	const trend = $derived({
		tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
		legend: { data: ['Postingan', 'Panel'], top: 0, right: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
		grid: { left: 8, right: 8, top: 36, bottom: 4, containLabel: true },
		xAxis: {
			type: 'category',
			data: data.days.map((d) => d.slice(8) + '/' + d.slice(5, 7)),
			axisLine: { lineStyle: { color: '#e2e8f0' } },
			axisTick: { show: false },
			axisLabel: { color: '#94a3b8' }
		},
		yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#94a3b8' } },
		series: [
			{ name: 'Postingan', type: 'bar', stack: 't', barMaxWidth: 22, data: data.series.post, itemStyle: { color: '#6366f1' } },
			{ name: 'Panel', type: 'bar', stack: 't', barMaxWidth: 22, data: data.series.reply, itemStyle: { color: '#38bdf8', borderRadius: [4, 4, 0, 0] } }
		]
	});

	const postPct = $derived(c.total ? Math.round((c.posts / c.total) * 100) : 0);

	const donut = $derived({
		tooltip: { trigger: 'item', formatter: '{b}: <b>{c}</b> ({d}%)' },
		title: {
			text: fmtNum(c.total),
			subtext: 'total rekap',
			left: 'center',
			top: '38%',
			textStyle: { fontSize: 28, fontWeight: 600, color: '#0f172a', fontFamily: 'Inter' },
			subtextStyle: { fontSize: 12, color: '#64748b', fontFamily: 'Inter' },
			itemGap: 4
		},
		series: [
			{
				type: 'pie',
				radius: ['62%', '88%'],
				center: ['50%', '50%'],
				padAngle: 3,
				itemStyle: { borderRadius: 8 },
				label: { show: false },
				emphasis: { scale: true, scaleSize: 6 },
				data: [
					{ name: 'Postingan', value: c.posts, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#818cf8' }, { offset: 1, color: '#4f46e5' }] } } },
					{ name: 'Panel', value: c.replies, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#7dd3fc' }, { offset: 1, color: '#0ea5e9' }] } } }
				]
			}
		]
	});
	const maxAcc = $derived(Math.max(1, ...data.perAccount.map((a) => a.month)));
</script>

<svelte:head><title>Dashboard · Retwepo</title></svelte:head>

<ReadinessAlert missingProfile={data.missingProfile} accounts={data.perAccount} />

{#if data.deletedRecent}
	<a
		href="/app/recaps?status=deleted&from=&to="
		class="mb-6 flex items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 transition hover:bg-rose-100/70 lg:mb-8"
	>
		<span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600"><Trash2 class="size-5" /></span>
		<div class="min-w-0 flex-1">
			<div class="font-semibold text-rose-900">{data.deletedRecent} rekap Anda dihapus admin dalam 30 hari terakhir</div>
			<p class="text-sm text-rose-800/80">Rekap tersebut tidak dihitung. Lihat alasannya agar tidak terulang.</p>
		</div>
		<span class="btn btn-soft-danger btn-sm shrink-0">Lihat alasan <ArrowRight /></span>
	</a>
{/if}

<!-- Hero -->
<section class="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-600 to-violet-600 p-6 text-white shadow-lg lg:mb-8 lg:p-8">
	<div class="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white/10 blur-2xl"></div>
	<div class="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-violet-400/20 blur-3xl"></div>
	<div class="relative flex flex-wrap items-center justify-between gap-6">
		<div>
			<p class="text-sm text-brand-100">{greet},</p>
			<h1 class="mt-1 text-2xl font-semibold tracking-tight lg:text-3xl">{data.me.nickname} 👋</h1>
			<p class="mt-2 max-w-xl text-sm text-brand-100">
				{#if c.today > 0}
					Hari ini Anda sudah mencatat <b class="text-white">{c.today} rekap</b>. Pertahankan!
				{:else}
					Belum ada rekap hari ini. Catat postingan atau panel Anda sekarang.
				{/if}
			</p>
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<div class="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur">
				<div class="flex items-center gap-1.5 text-xs text-brand-100"><Flame class="size-3.5" /> Hari aktif (30 hari)</div>
				<div class="mt-0.5 text-xl font-semibold">{c.active_days} <span class="text-sm font-normal text-brand-200">/ 30</span></div>
			</div>
			{#if canRecap}
				<a href="/app/recaps/new" class="btn btn-lg bg-white text-brand-700 shadow-md hover:bg-brand-50"><Plus class="!size-5" /> Tambah Rekap</a>
			{/if}
		</div>
	</div>
</section>

<!-- KPI -->
<div class="grid grid-cols-2 gap-4 lg:gap-6 xl:grid-cols-4">
	<Stat label="Hari ini" value={c.today} icon={CalendarCheck} tone="brand" hint="rekap tercatat hari ini" />
	<Stat label="7 hari terakhir" value={c.week} icon={CalendarRange} tone="sky" hint="rata-rata {Math.round((c.week / 7) * 10) / 10} / hari" />
	<Stat label="30 hari terakhir" value={c.month} prev={c.prev_month} icon={CalendarDays} tone="violet" />
	<Stat label="Total rekap" value={c.total} icon={Layers} tone="emerald" hint="terakhir {fmtDate(c.last_at)}" />
</div>

<div class="mt-6 grid gap-6 lg:mt-8 xl:grid-cols-3">
	<!-- Chart -->
	<div class="card p-0 xl:col-span-2">
		<div class="card-header">
			<div>
				<div class="card-title">Aktivitas 30 hari terakhir</div>
				<p class="mt-0.5 text-xs text-slate-500">Jumlah postingan dan panel per hari</p>
			</div>
		</div>
		<div class="p-5"><Chart option={trend} height="320px" /></div>
	</div>

	<!-- Komposisi -->
	<div class="card flex flex-col p-0">
		<div class="card-header">
			<div class="card-title">Komposisi rekap</div>
			<span class="text-xs text-slate-500">semua waktu</span>
		</div>
		<div class="flex flex-1 flex-col justify-center gap-4 p-5">
			{#if c.total}
				<Chart option={donut} height="240px" />
				<div class="grid grid-cols-2 gap-3">
					{#each [['Postingan', c.posts, postPct, 'bg-brand-500', FileText], ['Panel', c.replies, 100 - postPct, 'bg-sky-400', Reply]] as [lbl, n, pct, dot, Icon]}
						<div class="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3">
							<span class="flex size-9 shrink-0 items-center justify-center rounded-lg {dot} text-white"><Icon class="size-4" /></span>
							<div class="min-w-0">
								<div class="text-xs text-slate-500">{lbl}</div>
								<div class="flex items-baseline gap-1.5">
									<span class="text-lg font-semibold">{fmtNum(n)}</span>
									<span class="text-xs font-medium text-slate-400">{pct}%</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="py-10 text-center text-sm text-slate-500">Belum ada rekap.</p>
			{/if}
		</div>
	</div>
</div>

<!-- Per akun -->
<div class="card mt-6 p-0 lg:mt-8">
	<div class="card-header">
		<div class="card-title"><Link2 /> Performa per akun</div>
		<a href="/app/accounts" class="btn btn-ghost btn-sm">Kelola akun <ArrowRight /></a>
	</div>
	<div class="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
		{#each data.perAccount as a}
			<div class="flex flex-col gap-3 rounded-xl border border-slate-200/80 p-4">
				<div class="flex items-center gap-3">
					<PlatformIcon platform={a.platform} size={36} />
					<div class="min-w-0 flex-1">
						<div class="truncate text-sm font-semibold">@{a.username}</div>
						<div class="text-xs text-slate-500">{PLATFORMS[a.platform].label}</div>
					</div>
					{#if a.status !== 'approved'}
						<Badge cls={ACCOUNT_STATUS[a.status].cls} dot>{ACCOUNT_STATUS[a.status].label}</Badge>
					{/if}
				</div>
				<div class="flex items-end justify-between">
					<div>
						<div class="text-2xl font-semibold">{fmtNum(a.month)}</div>
						<div class="text-xs text-slate-500">30 hari · total {fmtNum(a.total)}</div>
					</div>
					{#if a.status === 'approved'}
						<a href="/app/recaps/new?account={a.id}" class="btn btn-soft-brand btn-sm"><Plus /> Rekap</a>
					{/if}
				</div>
				<div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
					<div class="h-full rounded-full" style="width:{(a.month / maxAcc) * 100}%;background:{PLATFORMS[a.platform].color}"></div>
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Terbaru -->
<div class="mt-6 lg:mt-8">
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-base font-semibold">Rekap terbaru</h2>
		<a href="/app/recaps" class="btn btn-ghost btn-sm">Lihat semua <ArrowRight /></a>
	</div>
	{#if data.recent.length}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 lg:gap-6">
			{#each data.recent as r (r.id)}<RecapCard {r} href="/app/recaps/{r.id}" />{/each}
		</div>
	{:else}
		<EmptyState icon={Inbox} title="Belum ada rekap" description="Rekap postingan atau panel pertama Anda akan muncul di sini.">
			<a href="/app/recaps/new" class="btn btn-primary"><Plus /> Buat rekap pertama</a>
		</EmptyState>
	{/if}
</div>
