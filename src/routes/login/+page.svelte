<script>
	let { data } = $props();
</script>

<svelte:head><title>Masuk · Retwepo</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-4">
	<div class="w-full max-w-sm">
		<div class="mb-8 text-center">
			<img src="/favicon.svg" alt="" class="mx-auto h-12 w-12" />
			<h1 class="mt-4 text-2xl font-bold">Retwepo</h1>
			<p class="mt-1 text-sm text-slate-500">Rekap postingan & reply media sosial</p>
		</div>

		<div class="card space-y-4">
			{#if data.error}
				<div class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{data.error}</div>
			{/if}

			<a
				href="/auth/google"
				data-sveltekit-reload
				class="btn btn-secondary w-full py-2.5 {data.googleReady ? '' : 'pointer-events-none opacity-50'}"
			>
				<svg class="h-5 w-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
				Masuk dengan Google
			</a>
			{#if !data.googleReady}
				<p class="text-center text-xs text-amber-600">Google OAuth belum dikonfigurasi di <code>.env</code></p>
			{/if}

			{#if data.dev}
				<div class="border-t border-dashed border-slate-200 pt-4">
					<p class="mb-2 text-xs font-semibold text-slate-500 uppercase">Login dev (hanya mode development)</p>
					<form method="POST" action="/auth/dev" class="flex gap-2">
						<input class="input" type="email" name="email" placeholder="email@contoh.com" required />
						<button class="btn btn-primary">Masuk</button>
					</form>
				</div>
			{/if}
		</div>
		<p class="mt-6 text-center text-xs text-slate-400">
			Belum punya akun? Cukup masuk dengan Google, lalu isi form pendaftaran.
		</p>
	</div>
</div>
