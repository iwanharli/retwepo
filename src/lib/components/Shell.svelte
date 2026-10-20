<script>
	import { page, navigating } from '$app/state';
	import PageSkeleton from './PageSkeleton.svelte';
	import {
		LayoutDashboard,
		Plus,
		History,
		Link2,
		UserRound,
		ChartColumn,
		Users,
		UserPlus,
		BadgeCheck,
		ScrollText,
		Bell,
		ShieldCheck,
		Images,
		Menu,
		X,
		PanelLeftClose,
		PanelLeftOpen,
		Megaphone,
		Send,
		FileSpreadsheet
	} from '@lucide/svelte';
	import { untrack } from 'svelte';
	import { Tooltip } from 'bits-ui';
	import UserMenu from './UserMenu.svelte';
	import NotificationBell from './NotificationBell.svelte';

	/** sidebarCollapsed: nilai awal dari cookie (dibaca di server agar tidak berkedip) */
	let { user, nav, children, badges = {}, inbox = null, sidebarCollapsed = false } = $props();
	let open = $state(false); // drawer di layar kecil
	// nilai awal saja (dari cookie); setelah itu diatur sendiri lewat toggleCollapsed
	let collapsed = $state(untrack(() => sidebarCollapsed)); // mode ikon di desktop

	function toggleCollapsed() {
		collapsed = !collapsed;
		document.cookie = `sidebar=${collapsed ? 'collapsed' : 'expanded'}; path=/; max-age=31536000; samesite=lax`;
	}

	function onKeydown(e) {
		// Ctrl/⌘ + B untuk ciutkan / buka sidebar
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
			e.preventDefault();
			toggleCollapsed();
		}
	}

	const ICONS = {
		dashboard: LayoutDashboard,
		add: Plus,
		history: History,
		accounts: Link2,
		profile: UserRound,
		stats: ChartColumn,
		users: Users,
		userPlus: UserPlus,
		badgeCheck: BadgeCheck,
		logs: ScrollText,
		campaign: Megaphone,
		announce: Send,
		export: FileSpreadsheet,
		bell: Bell,
		verify: ShieldCheck,
		gallery: Images
	};

	const cta = $derived(nav.find((i) => i.cta));

	// ---- loading antar halaman: kerangka (skeleton) sesuai halaman tujuan.
	// Ditunda sebentar agar navigasi cepat tidak berkedip; pada halaman yang sama (mis. ganti filter)
	// konten lama cukup diredupkan.
	let slow = $state(false);
	$effect(() => {
		if (!navigating.to) return void (slow = false);
		const t = setTimeout(() => (slow = true), 120);
		return () => clearTimeout(t);
	});
	const targetRoute = $derived(navigating.to?.route.id ?? null);
	const sameRoute = $derived(targetRoute !== null && targetRoute === page.route.id);

	// item aktif = href terpanjang yang cocok dengan path sekarang
	const current = $derived(
		nav
			.filter((i) => i.href && (page.url.pathname === i.href || page.url.pathname.startsWith(i.href + '/')))
			.sort((a, b) => b.href.length - a.href.length)[0]
	);
</script>

<svelte:window onkeydown={onKeydown} />

<div class="min-h-screen transition-[padding] duration-200 {collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}">
	<!-- Sidebar -->
	<aside
		class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-hidden [backface-visibility:hidden] isolate will-change-transform bg-gradient-to-b from-slate-950 via-[#12143a] to-[#1e1550] text-slate-300 transition-[transform,width] duration-200 lg:translate-x-0 {open
			? 'translate-x-0 shadow-2xl'
			: '-translate-x-full'} {collapsed ? 'lg:w-[72px]' : ''}"
		data-collapsed={collapsed}
	>
		<!-- efek cahaya dekoratif -->
		<!-- gradasi radial biasa (tanpa filter blur yang berat saat halaman di-scroll) -->
		<div class="pointer-events-none absolute -top-40 -left-36 size-96 bg-[radial-gradient(closest-side,rgb(99_102_241/0.28),transparent)]"></div>
		<div class="pointer-events-none absolute -right-40 -bottom-16 size-96 bg-[radial-gradient(closest-side,rgb(217_70_239/0.16),transparent)]"></div>
		<div
			class="pointer-events-none absolute inset-0 opacity-[0.04]"
			style="background-image:radial-gradient(#fff 1px,transparent 1px);background-size:18px 18px"
		></div>

		<div class="relative flex h-16 shrink-0 items-center gap-3 px-5 {collapsed ? 'lg:justify-center lg:px-0' : ''}">
			<span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-fuchsia-500 shadow-lg shadow-brand-500/40 ring-1 ring-white/20">
				<svg viewBox="0 0 32 32" class="size-5" aria-hidden="true"><path d="M9 22V10h7a4 4 0 0 1 0 8h-7m7 0 5 4" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>
			</span>
			<div class="leading-tight {collapsed ? 'lg:hidden' : ''}">
				<div class="text-[15px] font-semibold tracking-tight text-white">Retwepo</div>
				<div class="text-[11px] text-slate-400">Rekap sosial media</div>
			</div>
			<button class="ml-auto flex size-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white lg:hidden" onclick={() => (open = false)} aria-label="Tutup menu">
				<X class="size-5" />
			</button>
		</div>

		<div class="relative mx-4 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>

		<Tooltip.Provider delayDuration={0}>
			<nav class="relative flex-1 overflow-x-hidden overflow-y-auto px-3 pb-6">
				{#each nav.filter((i) => !i.cta) as item}
					{#if item.section}
						<div class="px-3 pt-6 pb-2.5 text-[11px] font-semibold tracking-[0.12em] whitespace-nowrap text-slate-500 uppercase {collapsed ? 'lg:hidden' : ''}">
							{item.section}
						</div>
						{#if collapsed}<div class="mx-3 my-4 hidden h-px bg-white/10 lg:block"></div>{/if}
					{:else}
						{@const Icon = ICONS[item.icon]}
						{@const active = current?.href === item.href}
						<Tooltip.Root disabled={!collapsed}>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<a
										{...props}
										href={item.href}
										onclick={() => (open = false)}
										aria-current={active ? 'page' : undefined}
										aria-label={item.label}
										class="group relative mb-1 flex h-12 items-center gap-3 rounded-xl px-2 text-[15px] font-medium transition-all duration-150 {active
											? 'bg-gradient-to-r from-brand-500/30 via-brand-500/10 to-transparent text-white ring-1 ring-white/10'
											: 'text-slate-400 hover:bg-white/[0.06] hover:text-white'} {collapsed ? 'lg:justify-center lg:px-0' : ''}"
									>
										{#if active}
											<span class="absolute top-2.5 bottom-2.5 -left-3 w-1 rounded-r-full bg-gradient-to-b from-brand-300 to-fuchsia-400 shadow-[0_0_12px_2px] shadow-brand-400/60 {collapsed ? 'lg:hidden' : ''}"></span>
										{/if}
										<span
											class="flex size-8 shrink-0 items-center justify-center rounded-lg transition {active
												? 'bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-md shadow-brand-500/50'
												: 'bg-white/[0.04] text-slate-400 ring-1 ring-white/[0.06] group-hover:bg-white/10 group-hover:text-white'}"
										>
											<Icon class="size-[18px]" />
										</span>
										<span class="flex-1 whitespace-nowrap {collapsed ? 'lg:hidden' : ''}">{item.label}</span>
										{#if badges[item.href]}
											<span class="mr-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-950 shadow-sm shadow-amber-400/40 {collapsed ? 'lg:hidden' : ''}">{badges[item.href]}</span>
											{#if collapsed}<span class="absolute top-1.5 right-2.5 hidden size-2.5 rounded-full bg-amber-400 ring-2 ring-slate-950 lg:block"></span>{/if}
										{/if}
									</a>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Portal>
								<Tooltip.Content side="right" sideOffset={12} class="z-50 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-xl ring-1 ring-white/10">
									{item.label}{badges[item.href] ? ` · ${badges[item.href]}` : ''}
								</Tooltip.Content>
							</Tooltip.Portal>
						</Tooltip.Root>
					{/if}
				{/each}
			</nav>

			<!-- Tombol utama: Tambah Rekap -->
			{#if cta}
				{@const CtaIcon = ICONS[cta.icon]}
				<div class="relative shrink-0 p-3 pt-2">
					<div class="mb-3 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>
					<Tooltip.Root disabled={!collapsed}>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<a
									{...props}
									href={cta.href}
									onclick={() => (open = false)}
									aria-label={cta.label}
									aria-current={current?.href === cta.href ? 'page' : undefined}
									class="group relative flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 px-4 text-[15px] font-semibold text-white shadow-lg shadow-fuchsia-500/30 ring-1 ring-white/20 transition hover:shadow-xl hover:shadow-fuchsia-500/40 hover:brightness-110 aria-[current=page]:ring-2 aria-[current=page]:ring-white/60 {collapsed
										? 'lg:size-12 lg:px-0'
										: ''}"
								>
									<!-- kilau yang bergerak saat hover -->
									<span class="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/25 opacity-0 transition-all duration-700 group-hover:left-full group-hover:opacity-100"></span>
									<CtaIcon class="relative size-5 shrink-0 transition group-hover:rotate-90" />
									<span class="relative whitespace-nowrap {collapsed ? 'lg:hidden' : ''}">{cta.label}</span>
								</a>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Portal>
							<Tooltip.Content side="right" sideOffset={12} class="z-50 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-xl ring-1 ring-white/10">
								{cta.label}
							</Tooltip.Content>
						</Tooltip.Portal>
					</Tooltip.Root>
				</div>
			{/if}
		</Tooltip.Provider>
	</aside>

	{#if open}
		<button class="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden" aria-label="Tutup menu" onclick={() => (open = false)}></button>
	{/if}

	<!-- Header -->
	<!-- tanpa backdrop-blur: efek kaca pada header sticky membuat sidebar (fixed) berkedip saat scroll di Chrome -->
	<header class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/95 px-4 lg:px-8">
		<button class="btn btn-ghost btn-icon lg:hidden" onclick={() => (open = true)} aria-label="Buka menu"><Menu /></button>
		<button
			class="btn btn-ghost btn-icon -ml-2 hidden text-slate-500 lg:inline-flex"
			onclick={toggleCollapsed}
			aria-label={collapsed ? 'Buka sidebar' : 'Ciutkan sidebar'}
			title="{collapsed ? 'Buka' : 'Ciutkan'} sidebar (Ctrl/⌘ + B)"
		>
			{#if collapsed}<PanelLeftOpen />{:else}<PanelLeftClose />{/if}
		</button>
		<div class="min-w-0 text-sm">
			<span class="text-slate-400">{user.role === 'admin' ? 'Admin' : 'Retwepo'}</span>
			<span class="mx-1.5 text-slate-300">/</span>
			<span class="font-medium text-slate-900">{current?.label ?? ''}</span>
		</div>
		<div class="ml-auto flex items-center gap-1.5">
			{#if inbox}<NotificationBell {inbox} />{/if}
			<UserMenu {user} />
		</div>
	</header>

	<!-- garis progres navigasi -->
	{#if navigating.to}
		<div class="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500" style="animation: nav-progress 8s cubic-bezier(0.1, 0.7, 0.2, 1) forwards"></div>
	{/if}

	<main class="w-full px-4 py-6 lg:px-8 lg:py-8">
		{#if slow && !sameRoute}
			<PageSkeleton route={targetRoute} />
		{:else}
			<div class="transition-opacity duration-200 {slow && sameRoute ? 'pointer-events-none opacity-50' : ''}">{@render children()}</div>
		{/if}
	</main>
</div>
