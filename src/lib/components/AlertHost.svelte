<script>
	import { fade, scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import { Check, X, TriangleAlert, Info } from '@lucide/svelte';
	import { alerts } from '#lib/toast.svelte.js';

	const STYLE = {
		success: { icon: Check, ring: 'bg-emerald-100 text-emerald-600 ring-emerald-50', title: 'Berhasil', btn: 'btn-success', bar: 'bg-emerald-500' },
		error: { icon: X, ring: 'bg-rose-100 text-rose-600 ring-rose-50', title: 'Tidak bisa diproses', btn: 'btn-danger', bar: 'bg-rose-500' },
		warning: { icon: TriangleAlert, ring: 'bg-amber-100 text-amber-600 ring-amber-50', title: 'Perhatian', btn: 'btn-primary', bar: 'bg-amber-500' },
		info: { icon: Info, ring: 'bg-sky-100 text-sky-600 ring-sky-50', title: 'Informasi', btn: 'btn-primary', bar: 'bg-sky-500' }
	};
	// hanya popup terakhir yang tampil; tutup dengan Esc / Enter
	const top = $derived(alerts.at(-1));
	function onkeydown(e) {
		if (top && (e.key === 'Escape' || e.key === 'Enter')) {
			e.preventDefault();
			top.close();
		}
	}
</script>

<svelte:window {onkeydown} />

{#if top}
	{@const s = STYLE[top.tone] ?? STYLE.info}
	{#key top.id}
		<div class="fixed inset-0 z-[70] flex items-center justify-center p-4">
			<button class="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" transition:fade={{ duration: 150 }} onclick={top.close} aria-label="Tutup"></button>
			<div
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="alert-title"
				transition:scale={{ start: 0.85, duration: 220, easing: backOut }}
				class="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white px-6 pt-8 pb-6 text-center shadow-2xl"
			>
				<span class="mx-auto flex size-16 items-center justify-center rounded-full ring-8 {s.ring} {top.tone === 'success' ? 'alert-pop' : top.tone === 'error' ? 'alert-shake' : ''}">
					<s.icon class="size-8" strokeWidth={2.5} />
				</span>
				<h2 id="alert-title" class="mt-5 text-lg font-semibold text-slate-900">{top.title ?? s.title}</h2>
				<p class="mt-1.5 text-sm break-words whitespace-pre-line text-slate-600">{top.message}</p>
				{#if top.timer}
					<button class="mt-5 text-xs text-slate-400 hover:text-slate-600" onclick={top.close}>Tutup</button>
					<span class="absolute bottom-0 left-0 h-1 w-full origin-left {s.bar}" style="animation: toast-timer {top.timer}ms linear forwards"></span>
				{:else}
					<!-- svelte-ignore a11y_autofocus -->
					<button class="btn {s.btn} mt-6 w-full" onclick={top.close} autofocus>Mengerti</button>
				{/if}
			</div>
		</div>
	{/key}
{/if}

<style>
	.alert-pop {
		animation: alert-pop 450ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.alert-shake {
		animation: alert-shake 400ms ease-in-out;
	}
	@keyframes alert-pop {
		0% { transform: scale(0.4); opacity: 0; }
		100% { transform: scale(1); opacity: 1; }
	}
	@keyframes alert-shake {
		0%, 100% { transform: translateX(0); }
		20%, 60% { transform: translateX(-6px); }
		40%, 80% { transform: translateX(6px); }
	}
</style>
