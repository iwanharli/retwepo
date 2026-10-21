<script>
	import Stat from '#lib/components/Stat.svelte';
	import Chart from '#lib/components/Chart.svelte';
	import RangeFilter from '#lib/components/RangeFilter.svelte';
	import PlatformIcon from '#lib/components/PlatformIcon.svelte';
	import Avatar from '#lib/components/Avatar.svelte';
	import { ChartLine, ChartPie, ChartBarStacked, Trophy, Flame, Grid3x3, ChartColumn, UserPlus, MoonStar, ArrowRight, PartyPopper, Eye, Layers, FileText, Reply, UserCheck, CalendarDays, Gauge, Users, Activity, AtSign, Image, Link2, LayoutDashboard, Clock, Megaphone, Hash, TrendingUp, TrendingDown, BadgeCheck, ShieldCheck, TriangleAlert, X } from '@lucide/svelte';
	import { page } from '$app/state';
	import { fly } from 'svelte/transition';
	import CampaignBadge from '#lib/components/CampaignBadge.svelte';
	import { PLATFORMS, fmtDate, fmtNum, adminUserHref, daysAgoWib } from '#lib/constants.js';

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
	const daysAgo = daysAgoWib; // hari kalender WIB

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

	// ---- tab
	const TABS = [
		['ringkasan', 'Ringkasan', LayoutDashboard],
		['pengguna', 'User & Akun', Users],
		['waktu', 'Waktu', Clock],
		['kampanye', 'Kampanye', Megaphone]
	];
	function tabHref(t) {
		const u = new URLSearchParams(page.url.search);
		if (t === 'ringkasan') u.delete('tab');
		else u.set('tab', t);
		const q = u.toString();
		return q ? `?${q}` : '/admin';
	}

	// ---- tab Waktu: postingan vs panel per hari/jam
	const typeTrendOption = $derived({
		tooltip: { trigger: 'axis' },
		legend: { top: 0 },
		grid: { left: 40, right: 16, top: 36, bottom: 30 },
		xAxis: { type: 'category', data: s.hourly ? s.days.map((h) => `${h}:00`) : s.days.map(label) },
		yAxis: { type: 'value', minInterval: 1 },
		series: [
			{ name: 'Postingan', type: 'bar', stack: 't', data: s.dailyType.post, itemStyle: { color: '#6366f1' } },
			{ name: 'Panel', type: 'bar', stack: 't', data: s.dailyType.reply, itemStyle: { color: '#38bdf8', borderRadius: [3, 3, 0, 0] } }
		]
	});

	// ---- tab Kampanye
	const CAMP_COLORS = ['#8b5cf6', '#f59e0b', '#14b8a6', '#f43f5e', '#0ea5e9', '#84cc16'];
	const cs = $derived(data.cstats);
	const campColor = (id) => CAMP_COLORS[(cs?.campaigns.findIndex((c) => c.id === id) ?? 0) % CAMP_COLORS.length];
	const campSum = $derived(cs ? cs.campaigns.reduce((t, c) => t + c.total, 0) : 0);
	const delta = (v, p) => (p === 0 ? (v > 0 ? 100 : 0) : Math.round(((v - p) / p) * 100));

	const campTrendOption = $derived(
		cs && {
			tooltip: { trigger: 'axis' },
			legend: { top: 0 },
			grid: { left: 40, right: 16, top: 36, bottom: 50 },
			dataZoom: cs.days.length > 45 ? [{ type: 'slider', height: 16, bottom: 8 }] : [],
			xAxis: { type: 'category', data: cs.hourly ? cs.days.map((h) => `${h}:00`) : cs.days.map(label), boundaryGap: false },
			yAxis: { type: 'value', minInterval: 1 },
			series: cs.campaigns.map((c) => ({
				name: `#${c.name}`,
				type: 'line',
				smooth: true,
				showSymbol: false,
				data: cs.series[c.id],
				itemStyle: { color: campColor(c.id) },
				lineStyle: { width: 2.5 },
				areaStyle: { opacity: 0.08 }
			}))
		}
	);

	const campDonutOption = $derived(
		cs && {
			tooltip: { trigger: 'item', formatter: '{b}: <b>{c}</b> ({d}%)' },
			title: {
				text: fmtNum(campSum),
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
					padAngle: 2,
					itemStyle: { borderRadius: 6 },
					label: { show: false },
					data: cs.campaigns.filter((c) => c.total).map((c) => ({ name: `#${c.name}`, value: c.total, itemStyle: { color: campColor(c.id) } }))
				}
			]
		}
	);

	const campPlatformOption = $derived.by(() => {
		if (!cs) return null;
		const ps = [...new Set(cs.byPlatform.map((r) => r.platform))];
		const get = (cid, p) => cs.byPlatform.find((r) => r.campaign_id === cid && r.platform === p)?.n ?? 0;
		return {
			tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
			legend: { top: 0 },
			grid: { left: 90, right: 20, top: 30, bottom: 20 },
			xAxis: { type: 'value', minInterval: 1 },
			yAxis: { type: 'category', data: ps.map((p) => PLATFORMS[p].label), inverse: true },
			series: cs.campaigns.map((c) => ({ name: `#${c.name}`, type: 'bar', data: ps.map((p) => get(c.id, p)), itemStyle: { color: campColor(c.id), borderRadius: [0, 4, 4, 0] } }))
		};
	});

	// ---- notifikasi "perlu ditinjau"
	const pendingKey = $derived(`${s.totals.pending_users}:${s.totals.pending_accounts}`);
	let dismissed = $state(null);
	$effect(() => {
		try {
			dismissed = sessionStorage.getItem('retwepo:pending-dismissed') ?? '';
		} catch {
			dismissed = ''; // storage tidak tersedia: tetap tampilkan
		}
	});
	const showPending = $derived(
		Boolean(s.totals.pending_users || s.totals.pending_accounts) && dismissed !== null && dismissed !== pendingKey
	);
	function dismissPending() {
		dismissed = pendingKey;
		try {
			sessionStorage.setItem('retwepo:pending-dismissed', pendingKey);
		} catch {
			/* abaikan */
		}
	}

	// ---- tujuan klik kartu: daftar rekap dengan filter yang sama
	function recapsHref(extra = {}) {
		const u = new URLSearchParams({ from: data.range.from, to: data.range.to });
		if (data.campaign) u.set('campaign', data.campaign);
		for (const k of data.platforms) u.append('platform', k);
		for (const [key, v] of Object.entries(extra)) u.set(key, v);
		return `/admin/recaps?${u}`;
	}

	// ---- kartu utama
	const change = (v, p) => (p === 0 ? (v > 0 ? 100 : 0) : Math.round(((v - p) / p) * 100));
	const totalDelta = $derived(change(k.total, s.prev.total));
	const usersDelta = $derived(change(k.active_users, s.prev.active_users));
	const participation = $derived(pct(k.active_users, s.totals.approved_users));
	const sparkOption = $derived({
		grid: { left: 0, right: 0, top: 4, bottom: 0 },
		xAxis: { type: 'category', show: false, boundaryGap: false, data: s.days },
		yAxis: { type: 'value', show: false, min: 0 },
		tooltip: { trigger: 'axis', formatter: (p) => `${s.hourly ? `${p[0].axisValue}:00` : label(p[0].axisValue)} — <b>${p[0].value}</b> rekap` },
		series: [
			{
				type: 'line',
				smooth: true,
				showSymbol: false,
				data: s.days.map((_, i) => Object.values(s.dailyPlatform).reduce((t, arr) => t + arr[i], 0)),
				lineStyle: { color: '#ffffff', width: 2 },
				areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(255,255,255,0.35)' }, { offset: 1, color: 'rgba(255,255,255,0)' }] } }
			}
		]
	});

	const maxUser = $derived(Math.max(1, ...s.topUsers.map((u) => u.total)));
	const maxAcc = $derived(Math.max(1, ...s.topAccounts.map((a) => a.total)));
</script>

<svelte:head><title>Statistik · Admin Retwepo</title></svelte:head>

<div class="mb-6">
	<div>
		<h1 class="text-2xl font-bold">Statistik</h1>
		<p class="text-sm text-slate-500">{fmtDate(data.range.from)} – {fmtDate(data.range.to)} · {data.range.days} hari{#if data.campaign} · <b class="text-violet-700">#{data.campaigns.find((c) => c.id === data.campaign)?.name}</b>{/if}</p>
	</div>
</div>
<RangeFilter from={data.range.from} to={data.range.to} platforms={data.platforms} campaign={data.campaign} campaigns={data.campaigns} />

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

<!-- tab -->
<nav class="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200" aria-label="Bagian statistik">
	{#each TABS as [key, lbl, Icon]}
		{@const active = data.tab === key}
		<a
			href={tabHref(key)}
			aria-current={active ? 'page' : undefined}
			data-sveltekit-noscroll
			class="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition {active
				? 'bg-brand-600 text-white shadow-sm'
				: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
		>
			<Icon class="size-4" />{lbl}
		</a>
	{/each}
</nav>

{#if data.tab === 'ringkasan'}
{#if showPending}
	<!-- notifikasi pojok kanan atas; ditutup = tidak muncul lagi sampai jumlahnya berubah -->
	<div
		role="alert"
		transition:fly={{ x: 40, duration: 250 }}
		class="fixed top-20 right-4 z-40 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-amber-200 bg-white p-4 shadow-xl ring-4 ring-amber-500/10"
	>
		<div class="flex items-start gap-3">
			<span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600"><TriangleAlert class="size-[18px]" /></span>
			<div class="min-w-0 flex-1">
				<p class="text-sm font-semibold text-slate-900">Perlu ditinjau</p>
				<ul class="mt-1.5 space-y-1 text-sm">
					{#if s.totals.pending_users}<li><a href="/admin/users?status=pending" class="font-medium text-amber-700 hover:underline">{fmtNum(s.totals.pending_users)} pendaftaran user baru →</a></li>{/if}
					{#if s.totals.pending_accounts}<li><a href="/admin/accounts" class="font-medium text-amber-700 hover:underline">{fmtNum(s.totals.pending_accounts)} pengajuan akun sosmed →</a></li>{/if}
				</ul>
			</div>
			<button type="button" class="-mt-1 -mr-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" onclick={dismissPending} aria-label="Tutup"><X class="size-4" /></button>
		</div>
	</div>
{/if}

{#snippet divider(title, sub)}
	<div class="mb-3 flex items-center gap-3">
		<h2 class="shrink-0 text-xs font-semibold tracking-wider text-slate-500 uppercase">{title}</h2>
		{#if sub}<span class="hidden shrink-0 text-xs text-slate-400 sm:inline">{sub}</span>{/if}
		<span class="h-px flex-1 bg-slate-200"></span>
	</div>
{/snippet}

<!-- 1. hasil utama: volume rekap -->
{@render divider('Aktivitas rekap', 'periode terpilih')}
<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
	<!-- kartu utama: total rekap -->
	<a href={recapsHref()} class="group relative col-span-2 block overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-violet-800 p-6 text-white shadow-lg shadow-brand-900/20 transition hover:-translate-y-0.5 hover:shadow-xl">
		<div class="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-white/10 [filter:none] [mask-image:radial-gradient(closest-side,#000,transparent)]"></div>
		<div class="relative flex items-start justify-between gap-4">
			<div>
				<p class="flex items-center gap-2 text-sm font-medium text-white/80"><Layers class="size-4" /> Total rekap</p>
				<p class="mt-0.5 text-xs text-white/60">Semua rekap postingan & panel yang tercatat di periode ini</p>
				<p class="mt-2 text-5xl font-bold tracking-tight">{fmtNum(k.total)}</p>
				<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/75">
					<span class="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-semibold text-white">
						{#if totalDelta > 0}<TrendingUp class="size-3.5" />{:else if totalDelta < 0}<TrendingDown class="size-3.5" />{/if}{totalDelta > 0 ? '+' : ''}{totalDelta}%
					</span>
					vs periode sebelumnya · ≈ {fmtNum(Math.round((k.total / data.range.days) * 10) / 10)} rekap / hari
				</div>
			</div>
			<div class="hidden w-1/2 max-w-64 sm:block"><Chart option={sparkOption} height="84px" /></div>
		</div>
		<!-- komposisi postingan vs panel -->
		<div class="relative mt-5">
			<div class="flex h-2 overflow-hidden rounded-full bg-white/15">
				<div class="bg-white" style="width:{pct(k.posts, k.total)}%"></div>
				<div class="bg-sky-300" style="width:{pct(k.replies, k.total)}%"></div>
			</div>
			<div class="mt-2 flex justify-between text-xs text-white/80">
				<span><span class="mr-1.5 inline-block size-2 rounded-full bg-white align-middle"></span>Postingan <b class="text-white">{fmtNum(k.posts)}</b></span>
				<span><span class="mr-1.5 inline-block size-2 rounded-full bg-sky-300 align-middle"></span>Panel <b class="text-white">{fmtNum(k.replies)}</b></span>
			</div>
		</div>
	</a>
	<Stat label="Postingan" href={recapsHref({ type: 'post' })} desc="Konten yang diunggah sendiri oleh user" value={k.posts} prev={data.stats.prev.posts} icon={FileText} tone="violet" />
	<Stat label="Panel" href={recapsHref({ type: 'reply' })} desc="Reply, like, retweet & share di postingan lain" value={k.replies} prev={data.stats.prev.replies} icon={Reply} tone="sky" />
</div>

<!-- 2. siapa yang bekerja -->
<div class="mt-8">
	{@render divider('Partisipasi user', 'dari user terverifikasi')}
	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
		<!-- kartu utama kedua: user aktif + cincin partisipasi -->
		<a href="/admin/members?sort=month&dir=desc" class="col-span-2 flex items-center gap-6 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
			<div class="relative size-28 shrink-0">
				<svg viewBox="0 0 36 36" class="size-full -rotate-90">
					<circle cx="18" cy="18" r="15.5" fill="none" class="stroke-emerald-100" stroke-width="3.5" />
					<circle cx="18" cy="18" r="15.5" fill="none" class="stroke-emerald-500" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="{(participation / 100) * 97.4} 97.4" />
				</svg>
				<div class="absolute inset-0 flex flex-col items-center justify-center">
					<span class="text-2xl font-bold text-emerald-700">{participation}%</span>
					<span class="text-[10px] font-medium tracking-wide text-emerald-600/80 uppercase">partisipasi</span>
				</div>
			</div>
			<div class="min-w-0">
				<p class="flex items-center gap-2 text-sm font-medium text-slate-500"><UserCheck class="size-4 text-emerald-600" /> User aktif</p>
				<p class="mt-1 text-4xl font-bold tracking-tight text-slate-900">{fmtNum(k.active_users)} <span class="text-lg font-medium text-slate-400">/ {fmtNum(s.totals.approved_users)}</span></p>
				<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
					<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold {usersDelta > 0 ? 'bg-emerald-100 text-emerald-700' : usersDelta < 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}">
						{#if usersDelta > 0}<TrendingUp class="size-3.5" />{:else if usersDelta < 0}<TrendingDown class="size-3.5" />{/if}{usersDelta > 0 ? '+' : ''}{usersDelta}%
					</span>
					vs periode sebelumnya
				</div>
				<p class="mt-2 text-xs text-slate-500">User terverifikasi yang membuat minimal 1 rekap di periode ini. Partisipasi = user aktif ÷ user terverifikasi.</p>
			</div>
		</a>
		<!-- perlu perhatian -->
		<a href="/admin/members?status=approved&sort=last&dir=asc" class="card group flex flex-col gap-3 border-rose-200 bg-rose-50/40 transition hover:border-rose-300 hover:shadow-md">
			<div class="flex items-start justify-between gap-2">
				<div>
					<span class="block text-sm font-medium text-rose-700">Tidak aktif 7 hari</span>
					<span class="mt-0.5 block text-xs leading-snug text-rose-700/60">User terverifikasi tanpa rekap dalam 7 hari terakhir</span>
				</div>
				<span class="flex size-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600"><MoonStar class="size-[18px]" /></span>
			</div>
			<div class="text-3xl font-semibold tracking-tight text-rose-600">{fmtNum(s.totals.inactive_users)}</div>
			<div class="flex items-center gap-1 text-xs text-rose-700/80">perlu ditindaklanjuti <ArrowRight class="size-3.5 transition group-hover:translate-x-0.5" /></div>
		</a>
		<Stat label="Rata-rata / user" href="/admin/members?sort=month&dir=desc" desc="Rekap per user aktif di periode ini" value={k.active_users ? Math.round((k.total / k.active_users) * 10) / 10 : 0} hint="rekap per user aktif" icon={Gauge} tone="violet" />
	</div>
</div>

<!-- 3. basis user & akun · 4. kualitas bukti -->
<div class="mt-8 grid gap-x-4 gap-y-8 lg:grid-cols-4">
	<div class="flex flex-col lg:col-span-3">
		{@render divider('User & akun', 'total terverifikasi')}
		<div class="grid flex-1 grid-cols-2 gap-4 md:grid-cols-3">
			<Stat label="User disetujui" href="/admin/members" desc="User yang sudah diverifikasi admin" value={s.totals.approved_users} hint="+{s.totals.new_users} daftar periode ini" icon={Users} tone="sky" />
			<Stat label="Akun sosmed disetujui" href="/admin/social" desc="Akun yang boleh dipakai untuk rekap" value={s.totals.approved_accounts} hint={s.totals.pending_accounts ? `+${fmtNum(s.totals.pending_accounts)} menunggu verifikasi` : 'total akun terverifikasi'} icon={BadgeCheck} tone="emerald" />
			<Stat label="Akun aktif" href="/admin/social?sort=last&dir=desc" desc="Akun yang dipakai merekap di periode ini" value={k.active_accounts} hint="{pct(k.active_accounts, s.totals.approved_accounts)}% akun dipakai periode ini" icon={AtSign} tone="amber" />
		</div>
	</div>
	<div class="flex flex-col">
		{@render divider('Kualitas bukti', 'periode ini')}
		<!-- screenshot & URL dalam satu kartu -->
		<a href={recapsHref({ evidence: 'shot' })} class="card flex flex-1 flex-col gap-3 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
			<div class="flex items-start justify-between gap-2">
				<div>
					<span class="block text-sm font-medium text-slate-500">Rekap dengan bukti</span>
					<span class="mt-0.5 block text-xs leading-snug text-slate-400">Porsi rekap yang menyertakan screenshot / URL</span>
				</div>
				<span class="flex size-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600"><ShieldCheck class="size-[18px]" /></span>
			</div>
			<!-- dua metrik berdampingan agar tinggi kartu sama dengan kartu statistik lain -->
			<div class="grid flex-1 grid-cols-2 gap-4">
				{#each [['Screenshot', k.with_shot, Image, 'bg-sky-500'], ['URL', k.with_url, Link2, 'bg-violet-500']] as [lbl, n, Icon, bar]}
					{@const v = pct(n, k.total)}
					<div class="flex flex-col justify-end">
						<span class="flex items-center gap-1.5 text-xs text-slate-500"><Icon class="size-3.5" />{lbl}</span>
						<span class="mt-1 text-2xl font-semibold tracking-tight">{v}%</span>
						<div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full {bar}" style="width:{v}%"></div></div>
						<span class="mt-1 text-xs text-slate-500">{fmtNum(n)}/{fmtNum(k.total)} rekap</span>
					</div>
				{/each}
			</div>
		</a>
	</div>
</div>


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

{/if}

{#if data.tab === 'pengguna'}
<div class="grid gap-6 xl:grid-cols-2">
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
{/if}

{#if data.tab === 'waktu'}
<div class="card p-0">
	{@render head(Grid3x3, 'Waktu paling aktif (WIB)', 'Jumlah rekap berdasarkan hari dan jam posting', null, 'bg-indigo-50 text-indigo-600')}
	<div class="p-5"><Chart option={heatOption} height="300px" /></div>
</div>

<div class="card mt-6 p-0">
	{@render head(ChartBarStacked, s.hourly ? 'Postingan vs panel per jam' : 'Postingan vs panel per hari', 'Komposisi tipe rekap sepanjang periode', null, 'bg-sky-50 text-sky-600')}
	<div class="p-5"><Chart option={typeTrendOption} height="300px" /></div>
</div>
{/if}

{#if data.tab === 'kampanye' && cs}
	{#if data.campaign}
		<p class="mb-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm text-violet-800">Tab ini membandingkan semua kampanye, jadi filter kampanye tidak dipakai di sini.</p>
	{/if}

	<!-- kartu per kampanye -->
	<div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
		{#each cs.campaigns as c (c.id)}
			{@const d = delta(c.total, c.prev_total)}
			{@const share = campSum ? Math.round((c.total / campSum) * 100) : 0}
			<section class="card flex flex-col gap-4">
				<div class="flex items-start justify-between gap-3">
					<div class="flex min-w-0 items-center gap-3">
						<span class="flex size-10 shrink-0 items-center justify-center rounded-xl text-white" style="background:{campColor(c.id)}"><Hash class="size-5" /></span>
						<div class="min-w-0">
							<h2 class="truncate font-semibold">#{c.name}</h2>
							<p class="text-xs text-slate-500">{c.active ? 'Aktif' : 'Ditutup'} · {fmtNum(c.all_time)} rekap sepanjang waktu</p>
						</div>
					</div>
					<a href="/admin/recaps?campaign={c.id}&from={data.range.from}&to={data.range.to}" class="btn btn-soft-brand btn-sm shrink-0"><Eye /> Rekap</a>
				</div>
				<div class="flex items-end justify-between gap-3">
					<div>
						<div class="text-3xl font-semibold tracking-tight">{fmtNum(c.total)}</div>
						<div class="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
							<span class="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium {d > 0 ? 'bg-emerald-50 text-emerald-700' : d < 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}">
								{#if d > 0}<TrendingUp class="size-3" />{:else if d < 0}<TrendingDown class="size-3" />{/if}{Math.abs(d)}%
							</span>
							vs periode sebelumnya
						</div>
					</div>
					<div class="text-right">
						<div class="text-2xl font-semibold" style="color:{campColor(c.id)}">{share}%</div>
						<div class="text-xs text-slate-500">porsi periode ini</div>
					</div>
				</div>
				<div class="h-2 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full" style="width:{share}%;background:{campColor(c.id)}"></div></div>
				<dl class="grid grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3 text-center text-sm">
					<div><dt class="text-xs text-slate-500">Postingan</dt><dd class="font-semibold">{fmtNum(c.posts)}</dd></div>
					<div><dt class="text-xs text-slate-500">Panel</dt><dd class="font-semibold">{fmtNum(c.replies)}</dd></div>
					<div><dt class="text-xs text-slate-500">User</dt><dd class="font-semibold">{fmtNum(c.users)}</dd></div>
					<div><dt class="text-xs text-slate-500">Akun</dt><dd class="font-semibold">{fmtNum(c.accounts)}</dd></div>
				</dl>
			</section>
		{/each}
	</div>

	<div class="card mt-6 p-0">
		{@render head(ChartLine, cs.hourly ? 'Tren per jam per kampanye' : 'Tren harian per kampanye', 'Jumlah rekap tiap kampanye pada periode terpilih', null, 'bg-violet-50 text-violet-600')}
		<div class="p-5"><Chart option={campTrendOption} height="340px" /></div>
	</div>

	<div class="mt-6 grid gap-6 lg:grid-cols-3">
		<div class="card flex flex-col p-0">
			{@render head(ChartPie, 'Porsi kampanye', 'Pembagian rekap antar kampanye', null, 'bg-violet-50 text-violet-600')}
			{#if campSum}
				<div class="flex-1 p-5"><Chart option={campDonutOption} height="260px" /></div>
			{:else}
				<p class="p-10 text-center text-sm text-slate-500">Belum ada rekap pada periode ini.</p>
			{/if}
		</div>
		<div class="card p-0 lg:col-span-2">
			{@render head(ChartBarStacked, 'Kampanye per platform', 'Jumlah rekap tiap kampanye di setiap platform', null, 'bg-sky-50 text-sky-600')}
			<div class="p-5"><Chart option={campPlatformOption} height="320px" /></div>
		</div>
	</div>

	<!-- user teratas per kampanye -->
	<div class="mt-6 grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
		{#each cs.campaigns as c (c.id)}
			{@const list = cs.topUsers.filter((u) => u.campaign_id === c.id)}
			<div class="card p-0">
				{@render head(Trophy, `User teraktif #${c.name}`, '5 teratas periode ini', null, 'bg-amber-50 text-amber-600')}
				<ol class="divide-y divide-slate-100">
					{#each list as u, i}
						<li class="flex items-center gap-3 px-5 py-2.5">
							{#if i < 3}
								<span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold shadow-sm {MEDAL[i]}">{i + 1}</span>
							{:else}
								<span class="flex size-6 shrink-0 items-center justify-center text-xs font-medium text-slate-400">{i + 1}</span>
							{/if}
							<Avatar user={{ nickname: u.nickname, email: u.email, avatarUrl: u.avatar_url }} size={30} />
							<span class="min-w-0 flex-1 truncate text-sm font-medium">{u.nickname ?? u.email}</span>
							<span class="text-sm font-semibold tabular-nums" style="color:{campColor(c.id)}">{fmtNum(u.total)}</span>
							<a href="/admin/members/{u.id}" class="btn btn-soft-brand btn-sm shrink-0"><Eye /> Detail</a>
						</li>
					{:else}
						<li class="p-8 text-center text-sm text-slate-500">Belum ada rekap.</li>
					{/each}
				</ol>
			</div>
		{/each}
	</div>
{/if}
