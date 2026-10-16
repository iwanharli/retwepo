<script>
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { UserRound, Wallet, Smartphone, Link2, Send, LoaderCircle, LogOut, CircleAlert, Check, Info } from '@lucide/svelte';
	import { EWALLETS } from '#lib/constants.js';
	import AccountRows from '#lib/components/AccountRows.svelte';
	import AuthLayout from '#lib/components/AuthLayout.svelte';
	import Avatar from '#lib/components/Avatar.svelte';
	import Flash from '#lib/components/Flash.svelte';

	let { data, form } = $props();
	let busy = $state(false);

	// nilai form di state lokal (bind:value) agar tidak tertimpa saat halaman di-render ulang
	const init = untrack(() => form?.values ?? data.me);
	let nickname = $state(init.nickname ?? untrack(() => data.me.googleName) ?? '');
	let ewProvider = $state(init.ewalletProvider ?? '');
	let ewNumber = $state(init.ewalletNumber ?? '');
	let ewConfirm = $state('');
	const clean = (v) => String(v ?? '').replace(/[\s-]/g, '');
	// null = belum selesai diketik, true = cocok, false = tidak sama
	const ewMatch = $derived(
		!ewConfirm ? null : clean(ewConfirm) === clean(ewNumber) ? true : clean(ewConfirm).length >= clean(ewNumber).length ? false : null
	);
</script>

<svelte:head><title>Pendaftaran · Retwepo</title></svelte:head>

{#snippet step(n, Icon, title, desc)}
	<div class="mb-4 flex items-center gap-3">
		<span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">{n}</span>
		<div>
			<h2 class="flex items-center gap-1.5 font-semibold text-slate-900"><Icon class="size-4 text-slate-400" />{title}</h2>
			{#if desc}<p class="text-xs text-slate-500">{desc}</p>{/if}
		</div>
	</div>
{/snippet}

<AuthLayout wide>
	<div class="mb-6 flex items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-slate-900">Lengkapi pendaftaran</h1>
			<p class="mt-1 text-slate-500">Isi data berikut. Admin akan memverifikasi sebelum Anda bisa membuat rekap.</p>
		</div>
		<form method="POST" action="/logout"><button class="btn btn-ghost btn-sm shrink-0"><LogOut /> Keluar</button></form>
	</div>

	{#if data.me.status === 'rejected'}
		<div class="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
			<CircleAlert class="mt-0.5 size-4 shrink-0" />
			<div><b>Pendaftaran sebelumnya ditolak.</b>{#if data.me.statusNote} Alasan: {data.me.statusNote}.{/if} Silakan perbaiki lalu kirim ulang.</div>
		</div>
	{/if}
	<Flash {form} />

	<form
		method="POST"
		class="card space-y-8 p-6 sm:p-8"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update({ reset: false });
				busy = false;
			};
		}}
	>
		<!-- akun Google -->
		<div class="flex items-center gap-3 rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200">
			<Avatar user={{ nickname: data.me.googleName, email: data.me.email, avatarUrl: data.me.avatarUrl }} size={40} />
			<div class="min-w-0">
				<div class="truncate text-sm font-medium">{data.me.googleName ?? data.me.email}</div>
				<div class="truncate text-xs text-slate-500">{data.me.email} · terhubung dengan Google</div>
			</div>
		</div>

		<section>
			{@render step(1, UserRound, 'Data diri')}
			<label class="label" for="nickname">Nama panggilan</label>
			<div class="relative">
				<UserRound class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
				<input class="input pl-9" id="nickname" name="nickname" bind:value={nickname} required maxlength="50" />
			</div>
		</section>

		<section>
			{@render step(2, Wallet, 'E-wallet', 'Dipakai admin untuk keperluan pembayaran — pastikan benar.')}
			<div class="grid gap-4 sm:grid-cols-5">
				<div class="sm:col-span-2">
					<label class="label" for="ewp">Penyedia</label>
					<div class="relative">
						<Wallet class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
						<select class="input pl-9" id="ewp" name="ewalletProvider" bind:value={ewProvider} required>
							<option value="" disabled>Pilih…</option>
							{#each EWALLETS as w}<option value={w}>{w}</option>{/each}
						</select>
					</div>
				</div>
				<div class="sm:col-span-3">
					<label class="label" for="ewn">Nomor e-wallet</label>
					<div class="relative">
						<Smartphone class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
						<input class="input pl-9 font-mono" id="ewn" name="ewalletNumber" bind:value={ewNumber} inputmode="numeric" placeholder="081234567890" required />
					</div>
				</div>
				<div class="sm:col-span-5">
					<label class="label" for="ewc">Ulangi nomor e-wallet</label>
					<div class="relative">
						<Smartphone class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
						<input
							class="input pl-9 font-mono {ewMatch === false ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : ewMatch ? 'border-emerald-400' : ''}"
							id="ewc"
							name="ewalletConfirm"
							inputmode="numeric"
							placeholder="Ketik ulang nomor yang sama"
							autocomplete="off"
							onpaste={(e) => e.preventDefault()}
							bind:value={ewConfirm}
							required
						/>
					</div>
					<p class="hint flex items-center gap-1.5 {ewMatch === false ? 'text-rose-600' : ewMatch ? 'text-emerald-600' : ''}">
						{#if ewMatch}<Check class="size-3.5" /> Nomor cocok.{:else if ewMatch === false}<CircleAlert class="size-3.5" /> Nomor tidak sama.{:else}<Info class="size-3.5" /> Tidak bisa ditempel (paste) — ketik manual.{/if}
					</p>
				</div>
			</div>
		</section>

		<section>
			{@render step(3, Link2, 'Akun media sosial', 'Setiap akun diverifikasi admin. Akun yang sudah dipakai user lain tidak bisa didaftarkan.')}
			<AccountRows initial={data.accounts} />
		</section>

		<button class="btn btn-primary btn-lg w-full" disabled={busy}>
			{#if busy}<LoaderCircle class="animate-spin" /> Mengirim…{:else}<Send /> Kirim pendaftaran{/if}
		</button>
	</form>
</AuthLayout>
