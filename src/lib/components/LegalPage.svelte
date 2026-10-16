<script>
	import { ArrowLeft } from '@lucide/svelte';
	/** Kerangka halaman kebijakan (publik, tanpa login) */
	let { title, updated, children } = $props();
</script>

<div class="min-h-screen px-4 py-10 sm:py-16">
	<article class="mx-auto max-w-3xl">
		<a href="/login" class="btn btn-ghost -ml-3 mb-6"><ArrowLeft /> Kembali</a>
		<div class="mb-8 flex items-center gap-3">
			<img src="/favicon.svg" alt="" class="size-10" />
			<div>
				<div class="font-semibold">Retwepo</div>
				<div class="text-xs text-slate-500">Rekap sosial media</div>
			</div>
		</div>
		<div class="card p-6 sm:p-10">
			<h1 class="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
			<p class="mt-1 text-sm text-slate-500">Terakhir diperbarui: {updated}</p>
			<div class="legal mt-8 space-y-6 text-[15px] leading-relaxed text-slate-700">{@render children()}</div>
		</div>
		<p class="mt-6 text-center text-xs text-slate-500">
			<a href="/privacy" class="hover:underline">Kebijakan Privasi</a> · <a href="/terms" class="hover:underline">Syarat Penggunaan</a>
		</p>
	</article>
</div>

<style>
	.legal :global(h2) {
		margin-bottom: 0.5rem;
		font-size: 1.0625rem;
		font-weight: 600;
		color: var(--color-slate-900);
	}
	.legal :global(ul) {
		list-style: disc;
		padding-left: 1.25rem;
	}
	.legal :global(li + li) {
		margin-top: 0.25rem;
	}
	.legal :global(a) {
		color: var(--color-brand-600);
		text-decoration: underline;
	}
</style>
