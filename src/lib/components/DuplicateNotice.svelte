<script>
	import { Copy, ArrowRight } from '@lucide/svelte';
	import { fmtDate } from '#lib/constants.js';
	/** dup: { count, mine: [{ id, posted_at }], others } */
	let { dup } = $props();
</script>

{#if dup?.count}
	<div class="mt-2 rounded-lg bg-orange-50 px-3 py-2.5 text-sm text-orange-900 ring-1 ring-orange-200">
		<p class="flex items-center gap-1.5 font-medium"><Copy class="size-4 text-orange-500" /> URL ini sudah pernah direkap</p>
		<ul class="mt-1 space-y-0.5 text-xs text-orange-800">
			{#each dup.mine as m}
				<li class="flex items-center gap-1">
					Oleh Anda pada {fmtDate(m.posted_at, true)}
					<a href="/app/recaps/{m.id}" target="_blank" class="inline-flex items-center gap-0.5 font-medium underline">lihat <ArrowRight class="size-3" /></a>
				</li>
			{/each}
			{#if dup.others}<li>Oleh {dup.others} user lain</li>{/if}
		</ul>
		<p class="mt-1.5 text-xs text-orange-700">Rekap duplikat akan ditandai untuk admin. Pastikan ini memang postingan/panel yang berbeda.</p>
	</div>
{/if}
