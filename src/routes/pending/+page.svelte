<script>
	import { Hourglass, CircleX, Ban, LogOut, RotateCcw, Clock, CircleCheck } from '@lucide/svelte';
	import { ACCOUNT_STATUS } from '#lib/constants.js';
	import AuthLayout from '#lib/components/AuthLayout.svelte';
	import Badge from '#lib/components/Badge.svelte';
	import PlatformTag from '#lib/components/PlatformTag.svelte';
	let { data } = $props();
	const s = $derived(data.me.status);
	const INFO = {
		pending: { icon: Hourglass, tone: 'bg-amber-100 text-amber-600 ring-amber-50', title: 'Menunggu persetujuan admin', text: 'Pendaftaran Anda sudah diterima dan sedang ditinjau. Silakan cek kembali nanti — halaman ini akan berubah setelah disetujui.' },
		rejected: { icon: CircleX, tone: 'bg-rose-100 text-rose-600 ring-rose-50', title: 'Pendaftaran ditolak', text: 'Perbaiki data sesuai alasan di bawah, lalu kirim ulang pendaftaran.' },
		suspended: { icon: Ban, tone: 'bg-slate-200 text-slate-600 ring-slate-100', title: 'Akun ditangguhkan', text: 'Anda tidak bisa membuat rekap untuk sementara. Hubungi admin untuk informasi lebih lanjut.' }
	};
	const info = $derived(INFO[s] ?? INFO.pending);
	const Icon = $derived(info.icon);
	const STATUS_ICON = { pending: Clock, approved: CircleCheck, rejected: CircleX };
</script>

<svelte:head><title>Status Pendaftaran · Retwepo</title></svelte:head>

<AuthLayout>
	<span class="flex size-14 items-center justify-center rounded-2xl ring-8 {info.tone}"><Icon class="size-7" /></span>
	<h1 class="mt-6 text-2xl font-semibold tracking-tight text-slate-900">{info.title}</h1>
	<p class="mt-2 text-slate-600">
		{#if s === 'pending'}Halo <b>{data.me.nickname}</b>,{' '}{/if}{info.text}
	</p>

	{#if data.me.statusNote && s !== 'pending'}
		<div class="mt-5 rounded-xl border px-4 py-3 text-sm {s === 'rejected' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-slate-200 bg-slate-50 text-slate-700'}">
			<b>Alasan:</b> {data.me.statusNote}
		</div>
	{/if}

	{#if data.accounts.length}
		<div class="card mt-6 p-0">
			<div class="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-700">Akun sosmed yang diajukan</div>
			<ul class="divide-y divide-slate-100">
				{#each data.accounts as a}
					{@const SI = STATUS_ICON[a.status]}
					<li class="flex items-center justify-between gap-3 px-4 py-3">
						<PlatformTag platform={a.platform} username={a.username} size={24} />
						<Badge cls={ACCOUNT_STATUS[a.status].cls}><SI class="size-3" />{ACCOUNT_STATUS[a.status].label}</Badge>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<div class="mt-8 flex flex-wrap gap-2">
		{#if s === 'rejected'}<a href="/register" class="btn btn-primary"><RotateCcw /> Perbaiki & daftar ulang</a>{/if}
		<form method="POST" action="/logout"><button class="btn btn-secondary"><LogOut /> Keluar</button></form>
	</div>
</AuthLayout>
