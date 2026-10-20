<script>
	import { Send, Megaphone, Users, Link2, Eye } from '@lucide/svelte';
	import { fmtDate, fmtNum } from '#lib/constants.js';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Flash from '#lib/components/Flash.svelte';
	import ActionDialog from '#lib/components/ActionDialog.svelte';
	import NotificationIcon from '#lib/components/NotificationIcon.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';

	let { data, form } = $props();
	let title = $state('');
	let body = $state('');
	let link = $state('');
	const ok = $derived(title.trim().length >= 3 && title.trim().length <= 120 && body.length <= 1000);
	const linkLabel = (v) => data.links.find(([k]) => k === (v ?? ''))?.[1] ?? v;
	const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
</script>

<svelte:head><title>Pengumuman · Admin Retwepo</title></svelte:head>

<PageHeader title="Pengumuman" description="Kirim notifikasi ke semua user terverifikasi — muncul di lonceng & halaman Notifikasi mereka." icon={Megaphone} />
<Flash {form} />

<div class="grid gap-6 xl:grid-cols-5">
	<!-- tulis pengumuman -->
	<section class="card p-0 xl:col-span-3">
		<div class="card-header"><div class="card-title"><Send /> Tulis pengumuman</div></div>
		<div class="space-y-5 p-5">
			<div>
				<label class="label" for="a-title">Judul</label>
				<input id="a-title" class="input" maxlength="120" placeholder="Mis. Target rekap minggu ini" bind:value={title} />
				<p class="hint flex justify-between"><span>Tampil tebal di notifikasi</span><span>{title.trim().length}/120</span></p>
			</div>
			<div>
				<label class="label" for="a-body">Isi <span class="font-normal text-slate-400">· opsional</span></label>
				<textarea id="a-body" class="input min-h-28" maxlength="1000" placeholder="Penjelasan singkat untuk user…" bind:value={body}></textarea>
				<p class="hint text-right">{body.length}/1000</p>
			</div>
			<div>
				<label class="label" for="a-link">Saat diklik, buka</label>
				<select id="a-link" class="input" bind:value={link}>
					{#each data.links as [v, l]}<option value={v}>{l}</option>{/each}
				</select>
			</div>

			<!-- pratinjau -->
			<div>
				<span class="label flex items-center gap-1.5"><Eye class="size-4 text-slate-400" /> Pratinjau</span>
				<div class="flex gap-4 rounded-xl border border-slate-200 bg-brand-50/40 px-4 py-3.5">
					<NotificationIcon type="announcement" size={40} />
					<div class="min-w-0">
						<div class="font-semibold break-words text-slate-900">{title.trim() || 'Judul pengumuman'}</div>
						{#if body.trim()}<p class="mt-1 text-sm break-words whitespace-pre-line text-slate-600">{body.trim()}</p>{/if}
					</div>
				</div>
			</div>

			<div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
				<span class="flex items-center gap-1.5 text-sm text-slate-500"><Users class="size-4" /> Akan dikirim ke <b class="text-slate-800">{fmtNum(data.recipients)} user</b></span>
				<ActionDialog
					action="send"
					fields={{ title: title.trim(), body: body.trim(), link }}
					tone="brand"
					icon={Megaphone}
					title="Kirim pengumuman?"
					description="Notifikasi langsung muncul di akun {fmtNum(data.recipients)} user terverifikasi dan tidak bisa ditarik kembali."
					confirmLabel="Kirim sekarang"
					triggerClass="btn btn-primary"
					triggerDisabled={!ok}
					onSuccess={() => ((title = ''), (body = ''), (link = ''))}
				>
					{#snippet trigger()}<Send /> Kirim pengumuman{/snippet}
					<p class="font-semibold break-words text-slate-900">{title.trim()}</p>
					{#if body.trim()}<p class="mt-1 text-sm break-words whitespace-pre-line text-slate-600">{body.trim()}</p>{/if}
				</ActionDialog>
			</div>
		</div>
	</section>

	<!-- riwayat -->
	<section class="card p-0 xl:col-span-2">
		<div class="card-header"><div class="card-title">Riwayat pengumuman</div><span class="text-xs text-slate-500">20 terakhir</span></div>
		{#if data.history.length}
			<ul class="divide-y divide-slate-100">
				{#each data.history as h (h.id)}
					{@const sent = h.meta?.recipients ?? 0}
					<li class="px-5 py-4">
						<div class="font-medium break-words text-slate-900">{h.meta?.title}</div>
						{#if h.meta?.body}<p class="mt-1 line-clamp-3 text-sm break-words whitespace-pre-line text-slate-600">{h.meta.body}</p>{/if}
						<div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
							<span>{fmtDate(h.created_at, true)}</span>
							<span>oleh {h.admin_nickname ?? h.admin_email ?? 'Admin'}</span>
							{#if h.meta?.link}<span class="flex items-center gap-1"><Link2 class="size-3" />{linkLabel(h.meta.link)}</span>{/if}
						</div>
						<div class="mt-2">
							<div class="flex justify-between text-xs"><span class="text-slate-500">Dibaca {fmtNum(h.read)} dari {fmtNum(sent)} user</span><span class="font-medium text-slate-700">{pct(h.read, sent)}%</span></div>
							<div class="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full bg-brand-500" style="width:{pct(h.read, sent)}%"></div></div>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<div class="p-5"><EmptyState icon={Megaphone} title="Belum ada pengumuman" description="Pengumuman yang dikirim akan tercatat di sini beserta jumlah user yang sudah membacanya." /></div>
		{/if}
	</section>
</div>
