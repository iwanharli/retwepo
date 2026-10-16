<script>
	import { Dialog } from 'bits-ui';
	import { X, ZoomIn, ZoomOut, Download, ExternalLink, LoaderCircle } from '@lucide/svelte';

	/**
	 * Penampil gambar layar penuh.
	 * src: URL gambar; title/subtitle: info di bar atas; download: nama file unduhan
	 * open (bindable): status tampil
	 */
	let { src, alt = '', title = '', subtitle = '', download = null, open = $bindable(false) } = $props();

	let zoom = $state(false);
	let loaded = $state(false);
	let size = $state(null); // ukuran asli gambar

	// selalu mulai dari "pas layar" setiap kali dibuka (juga saat dibuka dari luar lewat bind:open)
	$effect(() => {
		if (open) {
			zoom = false;
			loaded = false;
		}
	});

	function onLoad(e) {
		loaded = true;
		size = { w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight };
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm" />
		<Dialog.Content class="fixed inset-0 z-50 flex flex-col outline-none" aria-label={alt || title}>
			<!-- Bar atas -->
			<div class="flex shrink-0 items-center gap-3 bg-gradient-to-b from-black/60 to-transparent px-4 py-3 text-white sm:px-6">
				<div class="min-w-0 flex-1">
					<Dialog.Title class="truncate text-sm font-semibold">{title}</Dialog.Title>
					{#if subtitle || size}
						<p class="truncate text-xs text-white/60">
							{subtitle}{subtitle && size ? ' · ' : ''}{size ? `${size.w} × ${size.h} px` : ''}
						</p>
					{/if}
				</div>
				<button
					class="flex size-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
					onclick={() => (zoom = !zoom)}
					aria-label={zoom ? 'Pas layar' : 'Ukuran asli'}
					title={zoom ? 'Pas layar' : 'Ukuran asli'}
				>
					{#if zoom}<ZoomOut class="size-5" />{:else}<ZoomIn class="size-5" />{/if}
				</button>
				{#if download}
					<a
						href={src}
						{download}
						class="flex size-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
						aria-label="Unduh"
						title="Unduh"><Download class="size-5" /></a
					>
				{/if}
				<a
					href={src}
					target="_blank"
					rel="noopener"
					class="flex size-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
					aria-label="Buka di tab baru"
					title="Buka di tab baru"><ExternalLink class="size-5" /></a
				>
				<Dialog.Close
					class="ml-1 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
					aria-label="Tutup"
					title="Tutup (Esc)"><X class="size-5" /></Dialog.Close
				>
			</div>

			<!-- Gambar: klik area gelap untuk menutup, klik gambar untuk zoom -->
			<div
				class="relative min-h-0 flex-1 {zoom ? 'overflow-auto' : 'flex items-center justify-center overflow-hidden p-4 sm:p-8'}"
				role="presentation"
				onclick={(e) => e.target === e.currentTarget && (open = false)}
			>
				{#if !loaded}
					<div class="absolute inset-0 flex items-center justify-center text-white/60"><LoaderCircle class="size-8 animate-spin" /></div>
				{/if}
				<button
					class="block {zoom ? 'mx-auto cursor-zoom-out' : 'cursor-zoom-in'}"
					onclick={() => (zoom = !zoom)}
					aria-label={zoom ? 'Perkecil' : 'Perbesar'}
				>
					<img
						{src}
						{alt}
						onload={onLoad}
						class="select-none {zoom ? 'max-w-none' : 'max-h-[calc(100vh-8rem)] max-w-full rounded-lg object-contain shadow-2xl'} transition-opacity {loaded
							? 'opacity-100'
							: 'opacity-0'}"
						draggable="false"
					/>
				</button>
			</div>

			<p class="pointer-events-none shrink-0 pb-3 text-center text-xs text-white/40">
				Klik gambar untuk {zoom ? 'pas layar' : 'ukuran asli'} · Esc untuk menutup
			</p>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
