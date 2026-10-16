<script>
	import { page } from '$app/state';
	import { SearchX, ShieldAlert, ServerCrash, ArrowLeft, House, RotateCw, Hourglass } from '@lucide/svelte';

	const status = $derived(page.status);
	const info = $derived(
		status === 404
			? { icon: SearchX, title: 'Halaman tidak ditemukan', text: 'Halaman atau data yang Anda cari tidak ada, sudah dihapus, atau Anda tidak punya akses ke sana.', tone: 'bg-brand-100 text-brand-600 ring-brand-50' }
			: status === 403
				? { icon: ShieldAlert, title: 'Akses ditolak', text: 'Anda tidak memiliki izin untuk membuka halaman ini.', tone: 'bg-amber-100 text-amber-600 ring-amber-50' }
				: status >= 500
					? { icon: ServerCrash, title: 'Terjadi kesalahan di server', text: 'Maaf, ada masalah saat memproses permintaan Anda. Coba lagi beberapa saat lagi. Jika terus terjadi, laporkan ke admin beserta kode di bawah.', tone: 'bg-rose-100 text-rose-600 ring-rose-50' }
					: status === 429
						? { icon: Hourglass, title: 'Terlalu banyak percobaan', text: 'Demi keamanan, aksi ini dibatasi sementara.', tone: 'bg-amber-100 text-amber-600 ring-amber-50' }
						: { icon: ShieldAlert, title: 'Permintaan tidak bisa diproses', text: 'Periksa kembali lalu coba lagi.', tone: 'bg-slate-100 text-slate-600 ring-slate-50' }
	);
	// pesan dari server ditampilkan bila bukan pesan generik
	const detail = $derived(page.error?.message && !['Internal Error', 'Not Found'].includes(page.error.message) && status < 500 ? page.error.message : null);
	const Icon = $derived(info.icon);
</script>

<svelte:head><title>{status} · {info.title} · Retwepo</title></svelte:head>

<div class="flex min-h-screen items-center justify-center px-4 py-16">
	<div class="w-full max-w-lg text-center">
		<span class="mx-auto flex size-16 items-center justify-center rounded-2xl ring-8 {info.tone}"><Icon class="size-8" /></span>
		<p class="mt-8 text-sm font-semibold tracking-widest text-slate-400">ERROR {status}</p>
		<h1 class="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{info.title}</h1>
		<p class="mx-auto mt-3 max-w-md text-slate-600">{info.text}</p>
		{#if detail}<p class="mx-auto mt-3 max-w-md rounded-lg bg-white/70 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">{detail}</p>{/if}
		{#if page.error?.id}
			<p class="mt-4 text-xs text-slate-500">Kode referensi: <code class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700 select-all">{page.error.id}</code></p>
		{/if}

		<div class="mt-8 flex flex-wrap justify-center gap-2">
			<button class="btn btn-secondary" onclick={() => history.back()}><ArrowLeft /> Kembali</button>
			{#if status >= 500}<button class="btn btn-secondary" onclick={() => location.reload()}><RotateCw /> Coba lagi</button>{/if}
			<a href="/" class="btn btn-primary" data-sveltekit-reload><House /> Ke beranda</a>
		</div>
	</div>
</div>
