<script>
	import { enhance } from '$app/forms';
	import { Megaphone, Plus, Hash, Pencil, Lock, LockOpen, Images, LoaderCircle } from '@lucide/svelte';
	import { fmtDate, fmtNum } from '#lib/constants.js';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Flash from '#lib/components/Flash.svelte';
	import Badge from '#lib/components/Badge.svelte';
	import ActionDialog from '#lib/components/ActionDialog.svelte';

	let { data, form } = $props();
	let name = $state('');
	let busy = $state(false);
	let renameTo = $state({});
</script>

<svelte:head><title>Kelompok Kampanye · Admin Retwepo</title></svelte:head>

<PageHeader title="Kelompok Kampanye" description="Setiap rekap masuk ke satu kampanye. Kampanye yang ditutup tidak bisa dipilih untuk rekap baru, tapi rekap lamanya tetap tersimpan." icon={Megaphone} />

<Flash {form} />

<!-- tambah kampanye -->
<form
	method="POST"
	action="?/create"
	class="card mb-6 flex flex-wrap items-end gap-3 p-4 lg:p-5"
	use:enhance={() => {
		busy = true;
		return async ({ result, update }) => {
			busy = false;
			if (result.type === 'success') name = '';
			await update({ reset: false });
		};
	}}
>
	<div class="min-w-64 flex-1">
		<label class="label" for="cname">Kampanye baru</label>
		<div class="relative">
			<Hash class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
			<input id="cname" name="name" class="input pl-9" maxlength="61" placeholder="NamaKampanye" bind:value={name} required />
		</div>
		<p class="hint">Huruf, angka, atau _ tanpa spasi — mis. EconomicFrontline</p>
	</div>
	<button class="btn btn-primary mb-6" disabled={busy || name.trim().length < 2}>
		{#if busy}<LoaderCircle class="animate-spin" />{:else}<Plus />{/if} Tambah kampanye
	</button>
</form>

<div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
	{#each data.campaigns as c (c.id)}
		<section class="card flex flex-col gap-4 {c.active ? '' : 'opacity-75'}">
			<div class="flex items-start justify-between gap-3">
				<div class="flex min-w-0 items-center gap-3">
					<span class="flex size-11 shrink-0 items-center justify-center rounded-xl {c.active ? 'bg-violet-50 text-violet-600' : 'bg-slate-100 text-slate-400'}"><Hash class="size-5" /></span>
					<div class="min-w-0">
						<h2 class="truncate text-lg font-semibold">#{c.name}</h2>
						<div class="text-xs text-slate-500">dibuat {fmtDate(c.created_at)}</div>
					</div>
				</div>
				{#if c.active}<Badge cls="bg-emerald-100 text-emerald-700" dot>Aktif</Badge>{:else}<Badge cls="bg-slate-200 text-slate-600" dot>Ditutup</Badge>{/if}
			</div>

			<dl class="grid grid-cols-4 gap-3 rounded-xl bg-slate-50 p-3 text-center">
				<div><dt class="text-xs text-slate-500">Total rekap</dt><dd class="text-lg font-semibold">{fmtNum(c.total)}</dd></div>
				<div><dt class="text-xs text-slate-500">30 hari</dt><dd class="text-lg font-semibold">{fmtNum(c.month)}</dd></div>
				<div><dt class="text-xs text-slate-500">User</dt><dd class="text-lg font-semibold">{fmtNum(c.users)}</dd></div>
				<div><dt class="text-xs text-slate-500">Terakhir</dt><dd class="text-sm font-medium">{c.last_at ? fmtDate(c.last_at) : '—'}</dd></div>
			</dl>

			<div class="mt-auto flex flex-wrap justify-end gap-1.5">
				<a href="/admin/recaps?campaign={c.id}&from=&to=" class="btn btn-soft-brand btn-sm"><Images /> Rekap</a>
				<ActionDialog
					action="rename"
					fields={{ id: c.id }}
					tone="brand"
					icon={Pencil}
					title="Ganti nama #{c.name}?"
					description="Nama baru langsung tampil di semua rekap kampanye ini."
					confirmLabel="Simpan nama"
					triggerClass="btn btn-secondary btn-sm"
				>
					{#snippet trigger()}<Pencil /> Ganti nama{/snippet}
					<label class="label" for="rn-{c.id}">Nama baru</label>
					<div class="relative">
						<Hash class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
						<input id="rn-{c.id}" name="name" class="input pl-9" maxlength="61" value={renameTo[c.id] ?? c.name} oninput={(e) => (renameTo[c.id] = e.currentTarget.value)} required />
					</div>
				</ActionDialog>
				{#if c.active}
					<ActionDialog
						action="toggle"
						fields={{ id: c.id }}
						tone="warning"
						icon={Lock}
						title="Tutup kampanye #{c.name}?"
						description="Kampanye tidak bisa dipilih untuk rekap baru. {fmtNum(c.total)} rekap yang sudah ada tetap tersimpan dan terhitung."
						confirmLabel="Tutup kampanye"
						note={{ label: 'Catatan', placeholder: 'Mis. periode kampanye selesai' }}
						triggerClass="btn btn-soft-danger btn-sm"
					>
						{#snippet trigger()}<Lock /> Tutup{/snippet}
					</ActionDialog>
				{:else}
					<ActionDialog
						action="toggle"
						fields={{ id: c.id }}
						tone="success"
						icon={LockOpen}
						title="Buka kembali #{c.name}?"
						description="Kampanye bisa dipilih lagi di form rekap."
						confirmLabel="Buka kembali"
						triggerClass="btn btn-success btn-sm"
					>
						{#snippet trigger()}<LockOpen /> Buka kembali{/snippet}
					</ActionDialog>
				{/if}
			</div>
		</section>
	{/each}
</div>
