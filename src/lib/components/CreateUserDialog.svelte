<script>
	import { Dialog } from 'bits-ui';
	import { enhance } from '$app/forms';
	import { invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { UserPlus, X, Mail, UserRound, Wallet, Smartphone, ShieldCheck, LoaderCircle, CircleAlert, Check, TriangleAlert } from '@lucide/svelte';
	import { EWALLETS } from '#lib/constants.js';
	import { toastResult } from '#lib/toast.svelte.js';
	import AccountRows from './AccountRows.svelte';

	let open = $state(false);
	let role = $state('user');
	let confirmAdmin = $state(false);
	let busy = $state(false);
	let error = $state('');
	let formKey = $state(0);

	const actionUrl = $derived.by(() => {
		const s = new URLSearchParams(page.url.search);
		return `?${[...s].length ? `${s}&` : ''}/createUser`;
	});

	function reset() {
		role = 'user';
		confirmAdmin = false;
		error = '';
		formKey++; // kosongkan semua isian
	}

	const submit = () => {
		busy = true;
		error = '';
		return async ({ result }) => {
			busy = false;
			if (result.type === 'success') {
				open = false;
				toastResult(result);
				// langsung buka detail user baru
				if (result.data?.createdId) await goto(`/admin/members/${result.data.createdId}`);
				else await invalidateAll();
			} else error = result.data?.error ?? 'Gagal membuat user';
		};
	};
</script>

<Dialog.Root bind:open onOpenChange={(v) => v && reset()}>
	<Dialog.Trigger class="btn btn-primary"><UserPlus /> Tambah user</Dialog.Trigger>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
		>
			{#key formKey}
				<form method="POST" action={actionUrl} use:enhance={submit} class="flex min-h-0 flex-1 flex-col">
					<div class="flex gap-4 border-b border-slate-100 p-6 pb-5">
						<span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 ring-8 ring-brand-50"><UserPlus class="size-5" /></span>
						<div class="flex-1">
							<Dialog.Title class="text-base font-semibold text-slate-900">Tambah user baru</Dialog.Title>
							<Dialog.Description class="mt-1 text-sm text-slate-500">
								User langsung terverifikasi. Mereka cukup <b>masuk dengan Google</b> memakai email di bawah — tanpa mengisi form pendaftaran.
							</Dialog.Description>
						</div>
						<Dialog.Close class="btn btn-ghost btn-icon -mt-1 -mr-2 size-8" aria-label="Tutup"><X /></Dialog.Close>
					</div>

					<div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
						<!-- Peran -->
						<section>
							<span class="label">Peran</span>
							<div class="grid grid-cols-2 gap-3">
								{#each [['user', 'User', 'Membuat rekap postingan & panel', UserRound], ['admin', 'Admin', 'Akses penuh panel admin', ShieldCheck]] as [val, lbl, desc, Icon]}
									<label
										class="flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition {role === val
											? 'border-brand-500 bg-brand-50/50 ring-4 ring-brand-500/10'
											: 'border-slate-200 hover:bg-slate-50'}"
									>
										<input type="radio" name="role" value={val} bind:group={role} class="sr-only" />
										<span class="flex size-8 shrink-0 items-center justify-center rounded-lg {role === val ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}"><Icon class="size-4" /></span>
										<span>
											<span class="block text-sm font-semibold">{lbl}</span>
											<span class="block text-xs text-slate-500">{desc}</span>
										</span>
									</label>
								{/each}
							</div>
						</section>

						<!-- Identitas -->
						<section class="grid gap-4 sm:grid-cols-2">
							<div class="sm:col-span-2">
								<label class="label" for="cu-email">Email Google</label>
								<div class="relative">
									<Mail class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
									<input id="cu-email" name="email" type="email" class="input pl-9" placeholder="nama@gmail.com" required autocomplete="off" />
								</div>
							</div>
							<div class="sm:col-span-2">
								<label class="label" for="cu-nick">Nama panggilan</label>
								<div class="relative">
									<UserRound class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
									<input id="cu-nick" name="nickname" class="input pl-9" maxlength="50" required autocomplete="off" />
								</div>
							</div>
							<div>
								<label class="label" for="cu-ewp">E-wallet {#if role === 'admin'}<span class="font-normal text-slate-400">· opsional</span>{/if}</label>
								<div class="relative">
									<Wallet class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
									<select id="cu-ewp" name="ewalletProvider" class="input pl-9" required={role === 'user'}>
										<option value="">Pilih…</option>
										{#each EWALLETS as w}<option value={w}>{w}</option>{/each}
									</select>
								</div>
							</div>
							<div>
								<label class="label" for="cu-ewn">Nomor e-wallet</label>
								<div class="relative">
									<Smartphone class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
									<input id="cu-ewn" name="ewalletNumber" class="input pl-9 font-mono" inputmode="numeric" placeholder="081234567890" required={role === 'user'} />
								</div>
							</div>
						</section>

						<!-- Akun sosmed -->
						<section>
							<span class="label">Akun sosmed <span class="font-normal text-slate-400">· opsional, langsung terverifikasi</span></span>
							<AccountRows />
						</section>

						{#if role === 'admin'}
							<label class="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
								<input type="checkbox" name="confirmAdmin" value="1" bind:checked={confirmAdmin} class="mt-0.5 size-4 accent-amber-600" />
								<span>
									<span class="flex items-center gap-1.5 font-semibold"><TriangleAlert class="size-4" /> Beri akses admin penuh</span>
									<span class="text-amber-800/80">Admin bisa melihat semua data & e-wallet, menyetujui/menolak, menghapus rekap, dan membuat admin lain.</span>
								</span>
							</label>
						{/if}

						{#if error}
							<div class="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700"><CircleAlert class="mt-0.5 size-4 shrink-0" />{error}</div>
						{/if}
					</div>

					<div class="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
						<Dialog.Close type="button" class="btn btn-secondary">Batal</Dialog.Close>
						<button class="btn btn-primary" disabled={busy || (role === 'admin' && !confirmAdmin)}>
							{#if busy}<LoaderCircle class="animate-spin" /> Menyimpan…{:else}<Check /> Buat {role === 'admin' ? 'admin' : 'user'}{/if}
						</button>
					</div>
				</form>
			{/key}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
