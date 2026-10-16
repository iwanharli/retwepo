<script>
	import { CircleAlert, ShieldCheck, LogIn, FlaskConical } from '@lucide/svelte';
	import AuthLayout from '#lib/components/AuthLayout.svelte';
	let { data } = $props();
</script>

<svelte:head><title>Masuk · Retwepo</title></svelte:head>

<AuthLayout>
	<h1 class="text-2xl font-semibold tracking-tight text-slate-900">Selamat datang 👋</h1>
	<p class="mt-1.5 text-slate-500">Masuk dengan akun Google Anda untuk melanjutkan.</p>

	{#if data.error}
		<div class="mt-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><CircleAlert class="mt-0.5 size-4 shrink-0" />{data.error}</div>
	{/if}

	<a
		href="/auth/google"
		data-sveltekit-reload
		class="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-[15px] font-medium text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow {data.googleReady
			? ''
			: 'pointer-events-none opacity-50'}"
	>
		<svg class="size-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
		Masuk dengan Google
	</a>
	{#if !data.googleReady}
		<p class="mt-2 text-center text-xs text-amber-600">Google OAuth belum dikonfigurasi di <code>.env</code></p>
	{/if}

	<div class="mt-6 flex items-start gap-3 rounded-xl bg-slate-100/70 p-4 text-sm text-slate-600">
		<ShieldCheck class="mt-0.5 size-5 shrink-0 text-brand-600" />
		<p><b class="text-slate-800">Belum punya akun?</b> Cukup masuk dengan Google, lalu lengkapi form pendaftaran. Admin akan memverifikasi akun Anda.</p>
	</div>

	{#if data.dev}
		<div class="mt-8 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4">
			<p class="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-amber-700 uppercase"><FlaskConical class="size-3.5" /> Login dev — hanya mode development</p>
			<form method="POST" action="/auth/dev" class="flex gap-2">
				<input class="input" type="email" name="email" placeholder="email@contoh.com" required />
				<button class="btn btn-primary h-10"><LogIn /> Masuk</button>
			</form>
		</div>
	{/if}
</AuthLayout>
