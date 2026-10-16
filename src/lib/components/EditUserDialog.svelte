<script>
	import { Dialog } from 'bits-ui';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { UserPen, X, UserRound, Wallet, Smartphone, LoaderCircle, CircleAlert, Save, ArrowDown, Check } from '@lucide/svelte';
	import { EWALLETS } from '#lib/constants.js';
	import { toastResult } from '#lib/toast.svelte.js';

	/** u: data user (nickname, ewalletProvider, ewalletNumber, role) */
	let { u } = $props();

	let open = $state(false);
	let nickname = $state('');
	let provider = $state('');
	let number = $state('');
	let confirm = $state('');
	let note = $state('');
	let busy = $state(false);
	let error = $state('');

	const clean = (v) => String(v ?? '').replace(/[\s-]/g, '');
	const ewChanged = $derived(clean(number) !== (u.ewalletNumber ?? '') || (clean(number) !== '' && provider !== (u.ewalletProvider ?? '')));
	const confirmOk = $derived(!ewChanged || !clean(number) || clean(confirm) === clean(number));
	const anyChange = $derived(nickname.trim() !== (u.nickname ?? '') || ewChanged);
	const actionUrl = $derived.by(() => {
		const s = new URLSearchParams(page.url.search);
		return `?${[...s].length ? `${s}&` : ''}/editUserProfile`;
	});

	function reset() {
		nickname = u.nickname ?? '';
		provider = u.ewalletProvider ?? '';
		number = u.ewalletNumber ?? '';
		confirm = '';
		note = '';
		error = '';
	}

	const submit = () => {
		busy = true;
		error = '';
		return async ({ result }) => {
			busy = false;
			if (result.type === 'success') {
				open = false;
				await invalidateAll();
				toastResult(result);
			} else error = result.data?.error ?? 'Gagal menyimpan';
		};
	};
</script>

<Dialog.Root bind:open onOpenChange={(v) => v && reset()}>
	<Dialog.Trigger class="btn btn-soft-brand btn-sm"><UserPen /> Edit profil</Dialog.Trigger>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
		>
			<form method="POST" action={actionUrl} use:enhance={submit} class="flex min-h-0 flex-1 flex-col">
				<input type="hidden" name="id" value={u.id} />
				<div class="flex gap-4 border-b border-slate-100 p-6 pb-5">
					<span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 ring-8 ring-brand-50"><UserPen class="size-5" /></span>
					<div class="flex-1">
						<Dialog.Title class="text-base font-semibold text-slate-900">Edit profil {u.nickname ?? u.email}</Dialog.Title>
						<Dialog.Description class="mt-1 text-sm text-slate-500">User akan menerima notifikasi tentang perubahan ini.</Dialog.Description>
					</div>
					<Dialog.Close class="btn btn-ghost btn-icon -mt-1 -mr-2 size-8" aria-label="Tutup"><X /></Dialog.Close>
				</div>

				<div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
					<div>
						<label class="label" for="eu-nick">Nama panggilan</label>
						<div class="relative">
							<UserRound class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
							<input id="eu-nick" name="nickname" class="input pl-9" maxlength="50" bind:value={nickname} required />
						</div>
					</div>
					<div class="grid gap-4 sm:grid-cols-5">
						<div class="sm:col-span-2">
							<label class="label" for="eu-ewp">E-wallet {#if u.role === 'admin'}<span class="font-normal text-slate-400">· opsional</span>{/if}</label>
							<div class="relative">
								<Wallet class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
								<select id="eu-ewp" name="ewalletProvider" class="input pl-9" bind:value={provider}>
									<option value="">Pilih…</option>
									{#each EWALLETS as w}<option value={w}>{w}</option>{/each}
								</select>
							</div>
						</div>
						<div class="sm:col-span-3">
							<label class="label" for="eu-ewn">Nomor e-wallet</label>
							<div class="relative">
								<Smartphone class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
								<input id="eu-ewn" name="ewalletNumber" class="input pl-9 font-mono" inputmode="numeric" bind:value={number} />
							</div>
						</div>
					</div>

					{#if ewChanged && clean(number)}
						<!-- e-wallet berubah: tampilkan lama → baru & minta ketik ulang -->
						<div class="overflow-hidden rounded-xl border border-amber-200">
							<div class="flex items-center gap-3 bg-slate-50 px-4 py-2.5 text-sm">
								<span class="w-10 text-xs text-slate-500">Lama</span>
								<span class="text-slate-500">{u.ewalletProvider ?? '—'}</span>
								<span class="ml-auto font-mono text-slate-500 line-through">{u.ewalletNumber ?? '—'}</span>
							</div>
							<div class="flex justify-center border-y border-amber-100 bg-white py-0.5 text-slate-400"><ArrowDown class="size-3.5" /></div>
							<div class="flex items-center gap-3 bg-amber-50 px-4 py-2.5 text-sm">
								<span class="w-10 text-xs font-medium text-amber-700">Baru</span>
								<span class="font-medium">{provider || '—'}</span>
								<span class="ml-auto font-mono font-semibold">{clean(number)}</span>
							</div>
							<div class="bg-white p-3">
								<label class="label" for="eu-ewc">Ketik ulang nomor baru</label>
								<input
									id="eu-ewc"
									name="ewalletConfirm"
									class="input font-mono {confirm && !confirmOk && clean(confirm).length >= clean(number).length ? 'border-rose-400' : confirmOk && confirm ? 'border-emerald-400' : ''}"
									inputmode="numeric"
									autocomplete="off"
									bind:value={confirm}
									onpaste={(e) => e.preventDefault()}
								/>
								<p class="hint {confirmOk && confirm ? 'text-emerald-600' : ''}">
									{#if confirmOk && confirm}<Check class="inline size-3.5" /> Nomor cocok{:else}Pembayaran berikutnya dikirim ke nomor ini — ketik manual.{/if}
								</p>
							</div>
						</div>
					{/if}

					<div>
						<label class="label" for="eu-note">Alasan perubahan <span class="font-normal text-slate-400">· opsional</span></label>
						<textarea id="eu-note" name="note" class="input min-h-16" maxlength="500" placeholder="Mis. diminta user lewat WhatsApp" bind:value={note}></textarea>
						<p class="hint">Ikut dikirim di notifikasi user & tercatat di log.</p>
					</div>

					{#if error}
						<div class="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700"><CircleAlert class="mt-0.5 size-4 shrink-0" />{error}</div>
					{/if}
				</div>

				<div class="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
					<Dialog.Close type="button" class="btn btn-secondary">Batal</Dialog.Close>
					<button class="btn btn-primary" disabled={busy || !anyChange || !confirmOk}>
						{#if busy}<LoaderCircle class="animate-spin" /> Menyimpan…{:else}<Save /> Simpan perubahan{/if}
					</button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
