<script>
	import { ACCOUNT_STATUS } from '#lib/constants.js';
	import Badge from '#lib/components/Badge.svelte';
	import PlatformTag from '#lib/components/PlatformTag.svelte';
	let { data } = $props();
	const s = $derived(data.me.status);
</script>

<svelte:head><title>Status Pendaftaran · Retwepo</title></svelte:head>

<div class="flex min-h-screen items-center justify-center px-4">
	<div class="card w-full max-w-md text-center">
		{#if s === 'pending'}
			<div class="text-4xl">⏳</div>
			<h1 class="mt-3 text-xl font-bold">Menunggu Persetujuan Admin</h1>
			<p class="mt-2 text-sm text-slate-500">
				Halo <b>{data.me.nickname}</b>, pendaftaran Anda sudah diterima dan sedang ditinjau. Silakan cek kembali nanti.
			</p>
		{:else if s === 'rejected'}
			<div class="text-4xl">❌</div>
			<h1 class="mt-3 text-xl font-bold">Pendaftaran Ditolak</h1>
			{#if data.me.statusNote}<p class="mt-2 text-sm text-rose-600">Alasan: {data.me.statusNote}</p>{/if}
			<a href="/register" class="btn btn-primary mt-4">Perbaiki & Daftar Ulang</a>
		{:else if s === 'suspended'}
			<div class="text-4xl">🚫</div>
			<h1 class="mt-3 text-xl font-bold">Akun Ditangguhkan</h1>
			{#if data.me.statusNote}<p class="mt-2 text-sm text-slate-600">Alasan: {data.me.statusNote}</p>{/if}
			<p class="mt-2 text-sm text-slate-500">Hubungi admin untuk informasi lebih lanjut.</p>
		{/if}

		{#if data.accounts.length}
			<ul class="mt-6 space-y-2 text-left">
				{#each data.accounts as a}
					<li class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
						<PlatformTag platform={a.platform} username={a.username} />
						<Badge cls={ACCOUNT_STATUS[a.status].cls}>{ACCOUNT_STATUS[a.status].label}</Badge>
					</li>
				{/each}
			</ul>
		{/if}

		<form method="POST" action="/logout" class="mt-6">
			<button class="text-sm text-slate-500 hover:underline">Keluar</button>
		</form>
	</div>
</div>
