<script>
	import { CircleCheck } from '@lucide/svelte';
	import { PLATFORM_KEYS } from '#lib/constants.js';
	import PlatformIcon from './PlatformIcon.svelte';
	/** Kerangka halaman sebelum masuk aplikasi (login, pendaftaran, status) */
	let { children, wide = false } = $props();
	const points = ['Catat postingan & reply dari semua akun sosmed Anda', 'Bukti URL atau screenshot tersimpan rapi', 'Pantau aktivitas rekap harian Anda'];
</script>

<div class="flex min-h-screen">
	<!-- panel brand (desktop) -->
	<aside class="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden bg-gradient-to-b from-slate-950 via-[#12143a] to-[#1e1550] p-12 text-white lg:flex">
		<div class="pointer-events-none absolute -top-24 -left-20 size-80 rounded-full bg-brand-500/25 blur-3xl"></div>
		<div class="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-fuchsia-500/20 blur-3xl"></div>
		<div class="pointer-events-none absolute inset-0 opacity-[0.05]" style="background-image:radial-gradient(#fff 1px,transparent 1px);background-size:18px 18px"></div>

		<div class="relative flex items-center gap-3">
			<span class="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-fuchsia-500 shadow-lg shadow-brand-500/40 ring-1 ring-white/20">
				<svg viewBox="0 0 32 32" class="size-6" aria-hidden="true"><path d="M9 22V10h7a4 4 0 0 1 0 8h-7m7 0 5 4" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>
			</span>
			<div>
				<div class="text-lg font-semibold">Retwepo</div>
				<div class="text-xs text-slate-400">Rekap sosial media</div>
			</div>
		</div>

		<div class="relative">
			<h2 class="text-3xl leading-tight font-semibold tracking-tight">Semua rekap postingan & reply Anda, di satu tempat.</h2>
			<ul class="mt-8 space-y-3.5">
				{#each points as t}
					<li class="flex items-start gap-3 text-slate-300"><CircleCheck class="mt-0.5 size-5 shrink-0 text-emerald-400" />{t}</li>
				{/each}
			</ul>
			<div class="mt-10 flex gap-2.5">
				{#each PLATFORM_KEYS as k}<span class="rounded-xl bg-white/10 p-2 ring-1 ring-white/10"><PlatformIcon platform={k} size={26} /></span>{/each}
			</div>
		</div>

		<p class="relative text-xs text-slate-500">
			© {new Date().getFullYear()} Retwepo · <a href="/privacy" class="hover:text-slate-300">Kebijakan Privasi</a> ·
			<a href="/terms" class="hover:text-slate-300">Syarat Penggunaan</a>
		</p>
	</aside>

	<!-- konten -->
	<main class="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
		<div class="w-full {wide ? 'max-w-2xl' : 'max-w-md'}">
			<!-- logo (mobile) -->
			<div class="mb-8 flex items-center gap-3 lg:hidden">
				<img src="/favicon.svg" alt="" class="size-10" />
				<div>
					<div class="font-semibold">Retwepo</div>
					<div class="text-xs text-slate-500">Rekap sosial media</div>
				</div>
			</div>
			{@render children()}
		</div>
	</main>
</div>
