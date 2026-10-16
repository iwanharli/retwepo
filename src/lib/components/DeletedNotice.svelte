<script>
	import { Trash2 } from '@lucide/svelte';
	import { fmtDate, purgeDate } from '#lib/constants.js';
	/** Keterangan rekap yang dihapus admin. compact: versi kecil untuk kartu/tabel */
	let { r, compact = false } = $props();
</script>

{#if compact}
	<div class="rounded-lg bg-rose-50 px-2.5 py-2 text-xs text-rose-800 ring-1 ring-rose-200">
		<div class="flex items-center gap-1.5 font-semibold"><Trash2 class="size-3.5" /> Dihapus admin · {fmtDate(r.deletedAt, true)}</div>
		<p class="mt-0.5 line-clamp-2 {r.deleteReason ? '' : 'italic opacity-70'}">{r.deleteReason ?? 'Tanpa alasan'}</p>
		<p class="mt-1 text-[11px] opacity-70">Dihapus permanen {fmtDate(purgeDate(r.deletedAt))}</p>
	</div>
{:else}
	<div class="mb-6 flex gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-5">
		<span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 ring-8 ring-rose-100/50"><Trash2 class="size-5" /></span>
		<div class="min-w-0">
			<h2 class="font-semibold text-rose-900">Rekap ini dihapus admin</h2>
			<p class="mt-0.5 text-sm text-rose-800/80">
				{fmtDate(r.deletedAt, true)}{r.deletedByName ? ` oleh ${r.deletedByName}` : ''} · tidak dihitung dalam statistik maupun pembayaran.
				Data & screenshot akan dihapus permanen pada <b>{fmtDate(purgeDate(r.deletedAt))}</b>.
			</p>
			<p class="mt-3 rounded-lg bg-white/70 px-3 py-2 text-sm text-rose-900 ring-1 ring-rose-200">
				<b>Alasan:</b>
				{#if r.deleteReason}{r.deleteReason}{:else}<span class="italic opacity-70">Tidak ada alasan yang diberikan</span>{/if}
			</p>
		</div>
	</div>
{/if}
