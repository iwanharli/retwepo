<script>
	import { PenLine } from '@lucide/svelte';
	import { fmtDate } from '#lib/constants.js';
	/** compact: hanya ikon + "diedit" (tanggal di tooltip) — untuk kartu & tabel */
	let { at, compact = false } = $props();
</script>

{#if at}
	{#if compact}
		<span class="inline-flex items-center gap-0.5 text-[11px] whitespace-nowrap text-amber-600" title="Diedit {fmtDate(at, true)}"><PenLine class="size-3" />diedit</span>
	{:else}
		<span
			class="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-amber-700 ring-1 ring-amber-200"
			title="Diedit {fmtDate(at, true)}"
		>
			<PenLine class="size-3" /> Diedit · {fmtDate(at, true)}
		</span>
	{/if}
{/if}
