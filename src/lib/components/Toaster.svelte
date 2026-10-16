<script>
	import { fly } from 'svelte/transition';
	import { CircleCheck, CircleAlert, Info, X, Undo2 } from '@lucide/svelte';
	import { toasts, dismiss } from '#lib/toast.svelte.js';

	const ICON = { success: CircleCheck, error: CircleAlert, info: Info };
	const TONE = { success: 'text-emerald-400', error: 'text-rose-400', info: 'text-sky-400' };
</script>

<div class="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
	{#each toasts as t (t.id)}
		{@const Icon = ICON[t.tone] ?? Info}
		<div
			transition:fly={{ y: 16, duration: 200 }}
			class="pointer-events-auto relative flex items-center gap-3 overflow-hidden rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl ring-1 ring-white/10"
		>
			<Icon class="size-5 shrink-0 {TONE[t.tone] ?? TONE.info}" />
			<span class="flex-1">{t.message}</span>
			{#if t.action}
				<button
					class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
					onclick={() => {
						dismiss(t.id);
						t.action.run();
					}}><Undo2 class="size-3.5" />{t.action.label}</button
				>
			{/if}
			<button class="shrink-0 text-white/50 hover:text-white" onclick={() => dismiss(t.id)} aria-label="Tutup"><X class="size-4" /></button>
			<!-- sisa waktu -->
			<span class="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-white/30" style="animation: toast-timer {t.duration}ms linear forwards"></span>
		</div>
	{/each}
</div>

<style>
	@keyframes -global-toast-timer {
		from {
			transform: scaleX(1);
		}
		to {
			transform: scaleX(0);
		}
	}
</style>
