<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { BadgeCheck, CircleHelp, CircleOff, RefreshCw, LoaderCircle, Hand } from '@lucide/svelte';
	import { fmtDate } from '#lib/constants.js';
	import { toastResult } from '#lib/toast.svelte.js';

	/** check: hasil cek untuk nomor saat ini (null = belum); engine: status mesin cek */
	let { u, check, engine, canRecheck = true } = $props();
	let busy = $state(false);

	const actionUrl = $derived.by(() => {
		const s = new URLSearchParams(page.url.search);
		return `?${[...s].length ? `${s}&` : ''}/checkEwallet`;
	});
	const submit = () => {
		busy = true;
		return async ({ result }) => {
			busy = false;
			await invalidateAll();
			toastResult(result);
		};
	};
</script>

{#if u.ewalletNumber}
	<div class="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
		{#if check?.status === 'found'}
			<span class="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 ring-1 ring-emerald-200" title="Dicek otomatis {fmtDate(check.at, true)}">
				<BadgeCheck class="size-3.5" /> a.n. {check.name}
			</span>
		{:else if check?.status === 'not_found'}
			<span class="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 font-medium text-rose-700 ring-1 ring-rose-200" title="Dicek {fmtDate(check.at, true)}">
				<CircleOff class="size-3.5" /> Nomor tidak ditemukan — cocokkan manual
			</span>
		{:else if !engine.enabled}
			<span class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-600" title={engine.message}>
				<Hand class="size-3.5" /> Cek nama manual saat transfer
			</span>
		{:else if check?.status === 'unavailable' || !engine.ok}
			<span class="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-amber-700 ring-1 ring-amber-200" title={engine.message}>
				<CircleHelp class="size-3.5" /> Cek nama tidak tersedia — cocokkan manual saat transfer
			</span>
		{:else}
			<span class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-600"><LoaderCircle class="size-3.5 animate-spin" /> Sedang dicek…</span>
		{/if}
		{#if engine.enabled && canRecheck}
			<form method="POST" action={actionUrl} use:enhance={submit}>
				<input type="hidden" name="id" value={u.id} />
				<button class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800" disabled={busy} title="Cek ulang nama pemilik">
					<RefreshCw class="size-3.5 {busy ? 'animate-spin' : ''}" /> Cek ulang
				</button>
			</form>
		{/if}
	</div>
{/if}
