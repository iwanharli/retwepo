<script>
	import { enhance } from '$app/forms';
	import { UserRound, Mail, Wallet, Smartphone, Save, ShieldCheck, CalendarDays, Layers, Link2, LoaderCircle } from '@lucide/svelte';
	import { EWALLETS, fmtDate, fmtNum } from '#lib/constants.js';
	import Flash from '#lib/components/Flash.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Avatar from '#lib/components/Avatar.svelte';
	import { AlertDialog } from 'bits-ui';
	import { tick, untrack } from 'svelte';
	import { ArrowDown, TriangleAlert } from '@lucide/svelte';
	let { data, form } = $props();
	const p = $derived(data.profile);
	let busy = $state(false);

	// nilai form disimpan di state lokal agar tidak tertimpa saat halaman di-render ulang
	let nickname = $state(untrack(() => data.profile.nickname ?? ''));
	let ewProvider = $state(untrack(() => data.profile.ewalletProvider ?? ''));
	let ewNumber = $state(untrack(() => data.profile.ewalletNumber ?? ''));

	// konfirmasi perubahan e-wallet: tampilkan lama → baru & minta ketik ulang nomor baru
	let formEl = $state();
	let confirmOpen = $state(false);
	let pending = $state({ provider: '', number: '' });
	let retype = $state('');
	let confirmed = $state('');
	const clean = (v) => String(v ?? '').replace(/[\s-]/g, '');
	const retypeOk = $derived(clean(retype) === pending.number && pending.number !== '');

	function confirmAndSave() {
		confirmed = pending.number;
		confirmOpen = false;
		// tunggu input tersembunyi terisi, lalu kirim form
		tick().then(() => formEl.requestSubmit());
	}
</script>

<svelte:head><title>Profil · Retwepo</title></svelte:head>

<PageHeader title="Profil" description="Kelola informasi akun dan e-wallet Anda." icon={UserRound} />
<Flash {form} />

<div class="grid gap-6 xl:grid-cols-3">
	<!-- Ringkasan -->
	<aside class="card overflow-hidden p-0">
		<div class="h-24 bg-gradient-to-br from-brand-600 to-violet-600"></div>
		<div class="-mt-10 px-6 pb-6">
			<Avatar user={p} size={80} />
			<h2 class="mt-3 text-lg font-semibold">{p.nickname}</h2>
			<p class="text-sm text-slate-500">{p.email}</p>
			<span class="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
				<ShieldCheck class="size-3" /> Terverifikasi{p.role === 'admin' ? ' · Admin' : ''}
			</span>
		</div>
		<dl class="grid grid-cols-2 border-t border-slate-100">
			<div class="border-r border-slate-100 p-5">
				<dt class="flex items-center gap-1.5 text-xs text-slate-500"><Layers class="size-3.5" /> Total rekap</dt>
				<dd class="mt-1 text-xl font-semibold">{fmtNum(data.summary.recaps)}</dd>
			</div>
			<div class="p-5">
				<dt class="flex items-center gap-1.5 text-xs text-slate-500"><Link2 class="size-3.5" /> Akun aktif</dt>
				<dd class="mt-1 text-xl font-semibold">{fmtNum(data.summary.accounts)}</dd>
			</div>
		</dl>
		<div class="space-y-2 border-t border-slate-100 p-5 text-sm text-slate-600">
			<div class="flex items-center gap-2"><CalendarDays class="size-4 text-slate-400" /> Mendaftar {fmtDate(p.registeredAt)}</div>
			<div class="flex items-center gap-2"><ShieldCheck class="size-4 text-slate-400" /> Disetujui {fmtDate(p.reviewedAt)}</div>
		</div>
	</aside>

	<!-- Form -->
	<form
		method="POST"
		class="card p-0 xl:col-span-2"
		bind:this={formEl}
		use:enhance={({ formData, cancel }) => {
			const provider = String(formData.get('ewalletProvider'));
			const number = clean(formData.get('ewalletNumber'));
			const changed = provider !== p.ewalletProvider || number !== p.ewalletNumber;
			if (changed && confirmed !== number) {
				cancel();
				pending = { provider, number };
				retype = '';
				confirmOpen = true;
				return;
			}
			busy = true;
			return async ({ update }) => {
				await update({ reset: false });
				busy = false;
				confirmed = '';
			};
		}}
	>
		<input type="hidden" name="ewalletConfirm" value={confirmed} />
		<div class="card-header">
			<div>
				<div class="card-title">Informasi akun</div>
				<p class="mt-0.5 text-xs text-slate-500">Nomor e-wallet dipakai admin untuk keperluan pembayaran.</p>
			</div>
		</div>
		<div class="grid gap-6 p-6 md:grid-cols-2">
			<div class="md:col-span-2">
				<span class="label">Email Google</span>
				<div class="relative">
					<Mail class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
					<input class="input bg-slate-50 pl-9 text-slate-500" value={p.email} disabled />
				</div>
				<p class="hint">Email terikat dengan akun Google dan tidak bisa diubah.</p>
			</div>
			<div class="md:col-span-2">
				<label class="label" for="nn">Nama panggilan</label>
				<div class="relative">
					<UserRound class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
					<input class="input pl-9" id="nn" name="nickname" bind:value={nickname} required maxlength="50" />
				</div>
			</div>
			<div>
				<label class="label" for="ewp">Penyedia e-wallet</label>
				<div class="relative">
					<Wallet class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
					<select class="input pl-9" id="ewp" name="ewalletProvider" bind:value={ewProvider}>
						{#each EWALLETS as w}<option value={w}>{w}</option>{/each}
					</select>
				</div>
			</div>
			<div>
				<label class="label" for="ewn">Nomor e-wallet</label>
				<div class="relative">
					<Smartphone class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
					<input class="input pl-9 font-mono" id="ewn" name="ewalletNumber" bind:value={ewNumber} inputmode="numeric" />
				</div>
			</div>
		</div>
		<div class="flex justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-4">
			<button class="btn btn-primary" disabled={busy}>
				{#if busy}<LoaderCircle class="animate-spin" /> Menyimpan…{:else}<Save /> Simpan perubahan{/if}
			</button>
		</div>
	</form>
</div>

<AlertDialog.Root bind:open={confirmOpen}>
	<AlertDialog.Portal>
		<AlertDialog.Overlay class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" />
		<AlertDialog.Content
			class="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
		>
			<div class="flex gap-4 p-6 pb-5">
				<span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 ring-8 ring-amber-50"><TriangleAlert class="size-5" /></span>
				<div>
					<AlertDialog.Title class="text-base font-semibold text-slate-900">Ubah nomor e-wallet?</AlertDialog.Title>
					<AlertDialog.Description class="mt-1 text-sm text-slate-500">
						Pembayaran berikutnya akan dikirim ke nomor baru. Periksa kembali agar tidak salah kirim.
					</AlertDialog.Description>
				</div>
			</div>

			<div class="mx-6 mb-5 overflow-hidden rounded-xl border border-slate-200">
				<div class="flex items-center gap-3 bg-slate-50 px-4 py-3">
					<span class="w-12 text-xs text-slate-500">Lama</span>
					<span class="text-sm text-slate-500">{p.ewalletProvider ?? '—'}</span>
					<span class="ml-auto font-mono text-slate-500 line-through">{p.ewalletNumber ?? '—'}</span>
				</div>
				<div class="flex justify-center border-y border-slate-200 bg-white py-1 text-slate-400"><ArrowDown class="size-4" /></div>
				<div class="flex items-center gap-3 bg-emerald-50/60 px-4 py-3">
					<span class="w-12 text-xs font-medium text-emerald-700">Baru</span>
					<span class="text-sm font-medium">{pending.provider}</span>
					<span class="ml-auto font-mono text-lg font-semibold tracking-wide">{pending.number}</span>
				</div>
			</div>

			<div class="mx-6 mb-5">
				<label class="label" for="ew-retype">Ketik ulang nomor baru</label>
				<input
					id="ew-retype"
					class="input font-mono"
					inputmode="numeric"
					autocomplete="off"
					placeholder={pending.number}
					bind:value={retype}
					onpaste={(e) => e.preventDefault()}
				/>
				<p class="hint {retype && !retypeOk && clean(retype).length >= pending.number.length ? 'text-rose-600' : retypeOk ? 'text-emerald-600' : ''}">
					{retypeOk ? '✓ Nomor cocok' : retype && clean(retype).length >= pending.number.length ? 'Nomor tidak sama' : 'Tidak bisa ditempel (paste) — ketik manual.'}
				</p>
			</div>

			<div class="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
				<AlertDialog.Cancel class="btn btn-secondary">Batal</AlertDialog.Cancel>
				<button class="btn btn-primary" disabled={!retypeOk} onclick={confirmAndSave}><Save /> Ya, simpan nomor baru</button>
			</div>
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>
