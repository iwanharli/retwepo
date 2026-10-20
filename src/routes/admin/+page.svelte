<script>
	import Stat from '#lib/components/Stat.svelte';
	import Chart from '#lib/components/Chart.svelte';
	import RangeFilter from '#lib/components/RangeFilter.svelte';
	import PlatformIcon from '#lib/components/PlatformIcon.svelte';
	import Avatar from '#lib/components/Avatar.svelte';
	import { ChartLine, ChartPie, ChartBarStacked, Trophy, Flame, Grid3x3, ChartColumn, UserPlus, MoonStar, ArrowRight, PartyPopper, Eye, Layers, FileText, Reply, UserCheck, CalendarDays, Gauge, Users, Activity, AtSign, Image, Link2 } from '@lucide/svelte';
	import { PLATFORMS, fmtDate, fmtNum, adminUserHref } from '#lib/constants.js';

	let { data } = $props();
	const s = $derived(data.stats);
	const k = $derived(s.kpi);
	const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

	const label = (d) => d.slice(5).replace('-', '/');

	const trendOption = $derived({
		tooltip: { trigger: 'axis' },
		legend: { top: 0, type: 'scroll' },
		grid: { left: 40, right: 16, top: 36, bottom: 50 },
		dataZoom: s.days.length > 45 ? [{ type: 'slider', height: 16, bottom: 8 }] : [],
		xAxis: { type: 'category', data: s.hourly ? s.days.map((h) => `${h}:00`) : s.days.map(label), boundaryGap: false },
		yAxis: { type: 'value', minInterval: 1 },
		series: [
			...Object.entries(s.dailyPlatform).map(([p, data]) => ({
				name: PLATFORMS[p].label,
				type: 'line',
				smooth: true,
				showSymbol: false,
				data,
				itemStyle: { color: PLATFORMS[p].color },
				lineStyle: { width: 2 }
			})),
			{
				name: 'Total',
				type: 'line',
				smooth: true,
				showSymbol: false,
				data: s.days.map((_, i) => Object.values(s.dailyPlatform).reduce((t, arr) => t + arr[i], 0)),
				itemStyle: { color: '#6366f1' },
				lineStyle: { width: 3 },
				areaStyle: { opacity: 0.08 }
			}
		]
	});

	const platformTotals = $derived(
		Object.entries(
			s.byPlatform.reduce((acc, r) => ((acc[r.platform] = (acc[r.platform] ?? 0) + r.n), acc), {})
		).sort((a, b) => b[1] - a[1])
	);

	const platformSum = $derived(platformTotals.reduce((t, [, n]) => t + n, 0));
	const donutOption = $derived({
		tooltip: { trigger: 'item', formatter: '{b}: <b>{c}</b> ({d}%)' },
		title: {
			text: fmtNum(platformSum),
			subtext: 'rekap',
			left: 'center',
			top: '38%',
			textStyle: { fontSize: 26, fontWeight: 600, color: '#0f172a', fontFamily: 'Inter' },
			subtextStyle: { fontSize: 12, color: '#64748b', fontFamily: 'Inter' },
			itemGap: 2
		},
		series: [
			{
				type: 'pie',
				radius: ['64%', '90%'],
				center: ['50%', '50%'],
				padAngle: 2,
				itemStyle: { borderRadius: 6 },
				label: { show: false },
				emphasis: { scale: true, scaleSize: 5 },
				data: platformTotals.map(([p, n]) => ({ name: PLATFORMS[p].label, value: n, itemStyle: { color: PLATFORMS[p].color } }))
			}
		]
	});

	const MEDAL = ['from-amber-300 to-amber-500 text-amber-950', 'from-slate-200 to-slate-400 text-slate-800', 'from-orange-300 to-orange-500 text-orange-950'];
	const DAY = 86400000;
	const daysAgo = (d) => Math.floor((Date.now() - new Date(d)) / DAY);

	const typeByPlatformOption = $derived.by(() => {
		const ps = platformTotals.map(([p]) => p);
		const get = (p, t) => s.byPlatform.find((r) => r.platform === p && r.type === t)?.n ?? 0;
		return {
			tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
			legend: { top: 0 },
			grid: { left: 90, right: 20, top: 30, bottom: 20 },
			xAxis: { type: 'value', minInterval: 1 },
			yAxis: { type: 'category', data: ps.map((p) => PLATFORMS[p].label), inverse: true },
			series: [
				{ name: 'Postingan', type: 'bar', stack: 't', data: ps.map((p) => get(p, 'post')), itemStyle: { color: '#6366f1' } },
				{ name: 'Panel', type: 'bar', stack: 't', data: ps.map((p) => get(p, 'reply')), itemStyle: { color: '#38bdf8' } }
			]
		};
	});

	const DOW = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
	const heatOption = $derived({
		tooltip: { formatter: (p) => `${DOW[p.value[1]]} ${String(p.value[0]).padStart(2, '0')}:00 — <b>${p.value[2]}</b> rekap` },
		grid: { left: 40, right: 10, top: 10, bottom: 60 },
		xAxis: { type: 'category', data: [...Array(24).keys()].map((h) => String(h).padStart(2, '0')), splitArea: { show: true } },
		yAxis: { type: 'category', data: DOW, inverse: true, splitArea: { show: true } },
		visualMap: {
			min: 0,
			max: Math.max(1, ...s.heat.map((h) => h.n)),
			orient: 'horizontal',
			left: 'center',
			bottom: 0,
			itemHeight: 120,
			calculable: true,
			inRange: { color: ['#eef2ff', '#a5b4fc', '#4f46e5', '#312e81'] }
		},
		series: [{ type: 'heatmap', data: s.heat.map((h) => [h.hour, h.dow - 1, h.n]), emphasis: { itemStyle: { borderColor: '#000' } } }]
	});

	const bucketOption = $derived({
		tooltip: { trigger: 'axis' },
		grid: { left: 40, right: 10, top: 20, bottom: 30 },
		// interval 0: tampilkan semua label kelompok (jangan disembunyikan otomatis)
		xAxis: { type: 'category', data: s.buckets.map((b) => b.bucket), name: 'rekap', nameGap: 8, axisLabel: { interval: 0, fontSize: 11 } },
		yAxis: { type: 'value', minInterval: 1, name: 'user' },
		series: [
			{
				type: 'bar',
				data: s.buckets.map((b, i) => ({ value: b.users, itemStyle: { color: i === 0 ? '#f43f5e' : '#10b981', borderRadius: [4, 4, 0, 0] } })),
				label: { show: true, position: 'top' }
			}
		]
	});

	const growthOption = $derived({
		tooltip: { trigger: 'axis' },
		grid: { left: 30, right: 10, top: 20, bottom: 30 },
		xAxis: { type: 'category', data: s.growth.map((g) => g.week.slice(5).replace('-', '/')) },
		yAxis: { type: 'value', minInterval: 1 },
		series: [{ type: 'bar', data: s.growth.map((g) => g.n), itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] } }]
	});

	const maxUser = $derived(Math.max(1, ...s.topUsers.map((u) => u.total)));
	const maxAcc = $derived(Math.max(1, ...s.topAccounts.map((a) => a.total)));
</script>

<svelte:head><title>Statistik · Admin Retwepo</title></svelte:head>

<div class="mb-6 flex flex-wrap items-end justify-between gap-4">
	<div>
		<h1 class="text-2xl font-bold">Statistik</h1>
		<p class="text-sm text-slate-500">{fmtDate(data.range.from)} – {fmtDate(data.range.to)} · {data.range.days} hari{#if data.campaign} · <b class="text-violet-700">#{data.campaigns.find((c) => c.id === data.campaign)?.name}</b>{/if}</p>
	</div>
	<RangeFilter from={data.range.from} to={data.range.to} platform={data.platform} campaign={data.campaign} campaigns={data.campaigns} />
</div>

{#if s.totals.pending_users || s.totals.pending_accounts}
	<div class="mb-6 flex flex-wrap gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
		<span>⚠ Perlu ditinjau:</span>
		{#if s.totals.pending_users}<a href="/admin/users?status=pending" class="font-semibold hover:underline">{s.totals.pending_users} user baru</a>{/if}
		{#if s.totals.pending_accounts}<a href="/admin/accounts" class="font-semibold hover:underline">{s.totals.pending_accounts} akun sosmed</a>{/if}
	</div>
{/if}

<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
	<Stat label="Total rekap" value={k.total} prev={data.stats.prev.total} icon={Layers} tone="brand" />
	<Stat label="Postingan" value={k.posts} prev={data.stats.prev.posts} icon={FileText} tone="violet" />
	<Stat label="Panel" value={k.replies} prev={data.stats.prev.replies} icon={Reply} tone="sky" />
	<Stat label="User aktif" value={k.active_users} prev={data.stats.prev.active_users} icon={UserCheck} tone="emerald" />
</div>

<div class="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
	<Stat label="Rata-rata / hari" value={Math.round((k.total / data.range.days) * 10) / 10} hint="rekap per hari" icon={CalendarDays} tone="brand" />
	<Stat label="Rata-rata / user" value={k.active_users ? Math.round((k.total / k.active_users) * 10) / 10 : 0} hint="per user aktif" icon={Gauge} tone="violet" />
	<Stat label="User disetujui" value={s.totals.approved_users} hint="+{s.totals.new_users} daftar periode ini" icon={Users} tone="sky" />
	<Stat label="Partisipasi" value="{pct(k.active_users, s.totals.approved_users)}%" hint="aktif / disetujui" icon={Activity} tone="emerald" />
	<Stat label="Tidak aktif 7 hari" value={s.totals.inactive_users} accent="text-rose-600" hint="user disetujui" icon={MoonStar} tone="rose" />
	<Stat label="Akun aktif" value={k.active_accounts} hint="dari {fmtNum(s.totals.approved_accounts)} disetujui" icon={AtSign} tone="amber" />
	<Stat label="Dengan screenshot" value="{pct(k.with_shot, k.total)}%" hint="{fmtNum(k.with_shot)} rekap" icon={Image} tone="sky" />
	<Stat label="Dengan URL" value="{pct(k.with_url, k.total)}%" hint="{fmtNum(k.with_url)} rekap" icon={Link2} tone="violet" />
</div>

{#snippet head(Icon, title, sub = '', link = null, tone = 'bg-brand-50 text-brand-600')}
	<div class="card-header">
		<div class="flex min-w-0 items-center gap-3">
			<span class="flex size-9 shrink-0 items-center justify-center rounded-lg {tone}"><Icon class="size-[18px]" /></span>
			<div class="min-w-0">
				<h2 class="truncate text-sm font-semibold text-slate-900">{title}</h2>
				{#if sub}<p class="truncate text-xs text-slate-500">{sub}</p>{/if}
			</div>
		</div>
		{#if link}<a href={link} class="btn btn-ghost btn-sm shrink-0">Semua <ArrowRight /></a>{/if}
	</div>
{/snippet}

<div class="card mt-6 p-0">
	{@render head(ChartLine, s.hourly ? 'Tren rekap per jam per platform' : 'Tren rekap harian per platform', s.hourly ? `Jumlah rekap per jam (WIB) · ${fmtDate(data.range.from)}` : 'Jumlah rekap per hari pada periode terpilih')}
	<div class="p-5"><Chart option={trendOption} height="340px" /></div>
</div>

<div class="mt-6 grid gap-6 lg:grid-cols-3">
	<!-- Distribusi platform -->
	<div class="card flex flex-col p-0">
		{@render head(ChartPie, 'Distribusi platform', 'Porsi rekap per platform', null, 'bg-violet-50 text-violet-600')}
		{#if platformSum}
			<div class="px-5 pt-4"><Chart option={donutOption} height="200px" /></div>
			<ul class="space-y-3 p-5">
				{#each platformTotals as [p, n]}
					{@const share = Math.round((n / platformSum) * 100)}
					<li>
						<div class="flex items-center gap-2.5 text-sm">
							<PlatformIcon platform={p} size={22} />
							<span class="flex-1 font-medium text-slate-700">{PLATFORMS[p].label}</span>
							<span class="font-semibold tabular-nums">{fmtNum(n)}</span>
							<span class="w-10 text-right text-xs text-slate-400 tabular-nums">{share}%</span>
						</div>
						<div class="mt-1.5 ml-[30px] h-1.5 overflow-hidden rounded-full bg-slate-100">
							<div class="h-full rounded-full" style="width:{share}%;background:{PLATFORMS[p].color}"></div>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="p-10 text-center text-sm text-slate-500">Belum ada rekap pada periode ini.</p>
		{/if}
	</div>
	<div class="card p-0 lg:col-span-2">
		{@render head(ChartBarStacked, 'Postingan vs panel per platform', 'Komposisi tipe rekap di tiap platform', null, 'bg-sky-50 text-sky-600')}
		<div class="p-5"><Chart option={typeByPlatformOption} height="420px" /></div>
	</div>
</div>

<div class="mt-6 grid gap-6 xl:grid-cols-2">
	<!-- User teraktif -->
	<div class="card p-0">
		{@render head(Trophy, 'User teraktif', 'Peringkat jumlah rekap periode ini', '/admin/members?sort=month&dir=desc', 'bg-amber-50 text-amber-600')}
		<ol class="divide-y divide-slate-100">
			{#each s.topUsers as u, i}
				<li>
					<div class="flex items-center gap-3.5 px-5 py-3">
						{#if i < 3}
							<span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold shadow-sm {MEDAL[i]}">{i + 1}</span>
						{:else}
							<span class="flex size-7 shrink-0 items-center justify-center text-sm font-medium text-slate-400">{i + 1}</span>
						{/if}
						<Avatar user={{ nickname: u.nickname, email: u.email, avatarUrl: u.avatar_url }} size={36} />
						<div class="min-w-0 flex-1">
							<div class="flex items-baseline justify-between gap-2">
								<span class="truncate font-medium text-slate-900">{u.nickname ?? u.email}</span>
								<span class="shrink-0 text-base font-semibold tabular-nums">{fmtNum(u.total)}</span>
							</div>
							<div class="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-slate-100" style="width:{Math.max(8, (u.total / maxUser) * 100)}%">
								<div class="bg-brand-500" style="width:{(u.posts / u.total) * 100}%"></div>
								<div class="bg-sky-400" style="width:{(u.replies / u.total) * 100}%"></div>
							</div>
							<div class="mt-1 flex gap-3 text-xs text-slate-500">
								<span><span class="mr-1 inline-block size-1.5 rounded-full bg-brand-500 align-middle"></span>{u.posts} post</span>
								<span><span class="mr-1 inline-block size-1.5 rounded-full bg-sky-400 align-middle"></span>{u.replies} panel</span>
								<span class="ml-auto">{u.active_days} hari aktif</span>
							</div>
						</div>
					<a href="/admin/members/{u.id}" class="btn btn-soft-brand btn-sm shrink-0" title="Lihat detail"><Eye /> Detail</a></div>
				</li>
			{:else}
				<li class="p-10 text-center text-sm text-slate-500">Belum ada data.</li>
			{/each}
		</ol>
	</div>

	<!-- Akun sosmed teraktif -->
	<div class="card p-0">
		{@render head(Flame, 'Akun sosmed teraktif', 'Akun dengan rekap terbanyak periode ini', '/admin/social?sort=month&dir=desc', 'bg-rose-50 text-rose-600')}
		<ol class="divide-y divide-slate-100">
			{#each s.topAccounts as a, i}
				<li>
					<a
						href="/admin/social/{a.id}"
						class="flex items-center gap-3.5 px-5 py-3 transition hover:bg-slate-50/80"
						title="Detail akun @{a.username}"
					>
						{#if i < 3}
							<span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold shadow-sm {MEDAL[i]}">{i + 1}</span>
						{:else}
							<span class="flex size-7 shrink-0 items-center justify-center text-sm font-medium text-slate-400">{i + 1}</span>
						{/if}
						<PlatformIcon platform={a.platform} size={36} class="rounded-lg" />
						<div class="min-w-0 flex-1">
							<div class="flex items-baseline justify-between gap-2">
								<span class="truncate font-medium text-slate-900">@{a.username}</span>
								<span class="shrink-0 text-base font-semibold tabular-nums">{fmtNum(a.total)}</span>
							</div>
							<div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
								<div class="h-full rounded-full" style="width:{(a.total / maxAcc) * 100}%;background:{PLATFORMS[a.platform].color}"></div>
							</div>
							<div class="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
								<Avatar user={{ nickname: a.nickname, email: a.email, avatarUrl: a.avatar_url }} size={16} />
								<span class="truncate">{a.nickname ?? a.email}</span>
								<span class="ml-auto shrink-0">{a.posts} post · {a.replies} panel</span>
							</div>
						</div>
					</a>
				</li>
			{:else}
				<li class="p-10 text-center text-sm text-slate-500">Belum ada data.</li>
			{/each}
		</ol>
	</div>
</div>

<div class="card mt-6 p-0">
	{@render head(Grid3x3, 'Waktu paling aktif (WIB)', 'Jumlah rekap berdasarkan hari dan jam posting', null, 'bg-indigo-50 text-indigo-600')}
	<div class="p-5"><Chart option={heatOption} height="300px" /></div>
</div>

<div class="mt-6 grid gap-6 lg:grid-cols-3">
	<!-- grafik mengisi tinggi kartu (mengikuti kartu tertinggi di baris ini) -->
	<div class="card flex flex-col p-0">
		{@render head(ChartColumn, 'Sebaran keaktifan user', 'User disetujui menurut jumlah rekap periode ini', null, 'bg-emerald-50 text-emerald-600')}
		<div class="min-h-[260px] flex-1 p-5"><Chart option={bucketOption} height="100%" /></div>
	</div>
	<div class="card flex flex-col p-0">
		{@render head(UserPlus, 'Pendaftaran user baru', 'Per minggu, 12 minggu terakhir', null, 'bg-violet-50 text-violet-600')}
		<div class="min-h-[260px] flex-1 p-5"><Chart option={growthOption} height="100%" /></div>
	</div>

	<!-- Tidak aktif -->
	<div class="card flex flex-col p-0">
		{@render head(MoonStar, 'Tidak aktif ≥ 7 hari', `${fmtNum(s.totals.inactive_users)} user terverifikasi`, '/admin/members?status=approved&sort=last&dir=asc', 'bg-slate-100 text-slate-600')}
		{#if s.inactive.length}
			<ul class="flex-1 divide-y divide-slate-100">
				{#each s.inactive as u}
					<li>
						<div class="flex items-center gap-3 px-5 py-2.5">
							<Avatar user={{ nickname: u.nickname, email: u.email, avatarUrl: u.avatar_url }} size={32} />
							<div class="min-w-0 flex-1">
								<div class="truncate text-sm font-medium text-slate-900">{u.nickname ?? u.email}</div>
								<div class="truncate text-xs text-slate-500">{u.last_at ? `terakhir ${fmtDate(u.last_at)}` : `bergabung ${fmtDate(u.reviewed_at)}`}</div>
							</div>
							{#if u.last_at}
								<span class="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">{daysAgo(u.last_at)} hari</span>
							{:else}
								<span class="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-rose-200">Belum pernah</span>
							{/if}
						<a href={adminUserHref(u.id, 'approved')} class="btn btn-soft-brand btn-sm shrink-0" title="Lihat detail"><Eye /> Detail</a></div>
					</li>
				{/each}
			</ul>
			{#if s.totals.inactive_users > s.inactive.length}
				<a href="/admin/members?status=approved&sort=last&dir=asc" class="border-t border-slate-100 px-5 py-3 text-center text-xs font-medium text-brand-600 hover:bg-slate-50">
					+ {fmtNum(s.totals.inactive_users - s.inactive.length)} user lainnya
				</a>
			{/if}
		{:else}
			<div class="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center text-sm text-slate-500">
				<PartyPopper class="size-8 text-emerald-500" />Semua user aktif dalam 7 hari terakhir
			</div>
		{/if}
	</div>
</div>
