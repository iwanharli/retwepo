<script>
	import { enhance } from '$app/forms';
	import { Link2, Plus, ExternalLink, Trash2, Clock, CircleCheck, CircleX, ShieldCheck, Send, Layers, CalendarClock } from '@lucide/svelte';
	import { ACCOUNT_STATUS, PLATFORMS, fmtDate, fmtNum } from '#lib/constants.js';
	import PlatformIcon from '#lib/components/PlatformIcon.svelte';
	import Badge from '#lib/components/Badge.svelte';
	import Flash from '#lib/components/Flash.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import AccountRows from '#lib/components/AccountRows.svelte';
	import ActionDialog from '#lib/components/ActionDialog.svelte';
	import AccountSummary from '#lib/components/AccountSummary.svelte';
	let { data, form } = $props();
	let formKey = $state(0);

	const STATUS_ICON = { approved: CircleCheck, pending: Clock, rejected: CircleX };
	const counts = $derived(
		data.accounts.reduce((acc, a) => ((acc[a.status] = (acc[a.status] ?? 0) + 1), acc), {})
	);
</script>

<svelte:head><title>Akun Sosmed · Retwepo</title></svelte:head>

<PageHeader title="Akun Media Sosial" description="{counts.approved ?? 0} aktif · {counts.pending ?? 0} menunggu verifikasi" icon={Link2} />
<Flash {form} />

<div class="grid gap-6 xl:grid-cols-3">
	<div class="xl:col-span-2">
		<div class="grid gap-4 md:grid-cols-2 lg:gap-6">
			{#each data.accounts as a (a.id)}
				{@const Icon = STATUS_ICON[a.status]}
				<div class="card flex flex-col gap-4 p-0">
					<div class="flex items-center gap-3.5 p-5 pb-0">
						<PlatformIcon platform={a.platform} size={44} class="rounded-xl" />
						<div class="min-w-0 flex-1">
							<a href={PLATFORMS[a.platform].profile(a.username)} target="_blank" rel="noopener" class="flex items-center gap-1.5 font-semibold hover:text-brand-600">
								<span class="truncate">@{a.username}</span><ExternalLink class="size-3.5 shrink-0 text-slate-400" />
							</a>
							<div class="text-xs text-slate-500">{PLATFORMS[a.platform].label} · diajukan {fmtDate(a.created_at)}</div>
						</div>
						<Badge cls={ACCOUNT_STATUS[a.status].cls}><Icon class="size-3" />{ACCOUNT_STATUS[a.status].label}</Badge>
					</div>

					{#if a.status_note}
						<p class="mx-5 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">Catatan admin: {a.status_note}</p>
					{/if}

					<div class="mx-5 grid grid-cols-2 gap-3">
						<div class="rounded-lg bg-slate-50 px-3 py-2.5">
							<div class="flex items-center gap-1.5 text-xs text-slate-500"><Layers class="size-3.5" /> Total rekap</div>
							<div class="mt-0.5 text-lg font-semibold">{fmtNum(a.recaps)}</div>
						</div>
						<div class="rounded-lg bg-slate-50 px-3 py-2.5">
							<div class="flex items-center gap-1.5 text-xs text-slate-500"><CalendarClock class="size-3.5" /> Terakhir</div>
							<div class="mt-0.5 text-sm font-semibold">{fmtDate(a.last_at)}</div>
						</div>
					</div>

					<div class="mt-auto flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
						{#if a.status === 'approved'}
							<a href="/app/recaps?account={a.id}" class="btn btn-ghost btn-sm">Lihat rekap</a>
							<a href="/app/recaps/new?account={a.id}" class="btn btn-soft-brand btn-sm"><Plus /> Rekap</a>
						{:else}
							<ActionDialog
								action="remove"
								fields={{ id: a.id }}
								tone="danger"
								icon={Trash2}
								title="Hapus pengajuan akun?"
								description="Akun ini akan dihapus dari daftar Anda. Anda bisa mengajukannya lagi nanti."
								confirmLabel="Hapus pengajuan"
								triggerClass="btn btn-soft-danger btn-sm btn-icon"
								triggerLabel="Hapus pengajuan"
							>
								{#snippet trigger()}<Trash2 />{/snippet}
								<AccountSummary accounts={[a]} />
							</ActionDialog>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<aside class="space-y-6">
		<div class="card p-0 xl:sticky xl:top-24">
			<div class="card-header"><div class="card-title"><Plus /> Tambah akun</div></div>
			<form
				method="POST"
				action="?/add"
				class="space-y-4 p-5"
				use:enhance={() =>
					async ({ result, update }) => {
						await update();
						if (result.type === 'success') formKey++;
					}}
			>
				{#key formKey}<AccountRows />{/key}
				<button class="btn btn-primary w-full"><Send /> Ajukan verifikasi</button>
			</form>
			<div class="flex gap-3 border-t border-slate-100 bg-slate-50/50 p-5 text-xs text-slate-500">
				<ShieldCheck class="size-4 shrink-0 text-brand-500" />
				<p>Akun baru perlu diverifikasi admin sebelum bisa dipakai untuk rekap. Satu akun hanya bisa didaftarkan oleh satu user.</p>
			</div>
		</div>
	</aside>
</div>
