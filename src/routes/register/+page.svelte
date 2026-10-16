<script>
	import { enhance } from '$app/forms';
	import { EWALLETS } from '#lib/constants.js';
	import AccountRows from '#lib/components/AccountRows.svelte';
	import Flash from '#lib/components/Flash.svelte';

	let { data, form } = $props();
	const v = $derived(form?.values ?? data.me);
	let busy = $state(false);
	let ewn = $state();
	let ewMatch = $state(null);
	const clean = (v) => String(v ?? '').replace(/[\s-]/g, '');
</script>

<svelte:head><title>Pendaftaran · Retwepo</title></svelte:head>

<div class="mx-auto max-w-xl px-4 py-10">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Lengkapi Pendaftaran</h1>
		<form method="POST" action="/logout"><button class="text-sm text-slate-500 hover:underline">Keluar</button></form>
	</div>

	{#if data.me.status === 'rejected'}
		<div class="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
			Pendaftaran sebelumnya ditolak{data.me.statusNote ? `: ${data.me.statusNote}` : ''}. Silakan perbaiki dan kirim ulang.
		</div>
	{/if}
	<Flash {form} />

	<form
		method="POST"
		class="card space-y-5"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update({ reset: false });
				busy = false;
			};
		}}
	>
		<div>
			<span class="label">Email (terhubung dengan Google)</span>
			<div class="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
				{#if data.me.avatarUrl}<img src={data.me.avatarUrl} alt="" class="h-8 w-8 rounded-full" referrerpolicy="no-referrer" />{/if}
				<span class="text-sm">{data.me.email}</span>
			</div>
		</div>

		<div>
			<label class="label" for="nickname">Nama panggilan</label>
			<input class="input" id="nickname" name="nickname" value={v.nickname ?? data.me.googleName ?? ''} required maxlength="50" />
		</div>

		<div class="grid grid-cols-5 gap-3">
			<div class="col-span-2">
				<label class="label" for="ewp">E-wallet</label>
				<select class="input" id="ewp" name="ewalletProvider" value={v.ewalletProvider ?? ''} required>
					<option value="" disabled>Pilih…</option>
					{#each EWALLETS as w}<option value={w}>{w}</option>{/each}
				</select>
			</div>
			<div class="col-span-3">
				<label class="label" for="ewn">Nomor e-wallet</label>
				<input class="input" id="ewn" name="ewalletNumber" value={v.ewalletNumber ?? ''} inputmode="numeric" placeholder="081234567890" required bind:this={ewn} oninput={() => (ewMatch = null)} />
			</div>
			<div class="col-span-5">
				<label class="label" for="ewc">Ulangi nomor e-wallet</label>
				<input
					class="input {ewMatch === false ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : ''}"
					id="ewc"
					name="ewalletConfirm"
					inputmode="numeric"
					placeholder="Ketik ulang nomor yang sama"
					autocomplete="off"
					onpaste={(e) => e.preventDefault()}
					oninput={(e) => (ewMatch = clean(e.currentTarget.value) === clean(ewn.value) ? true : clean(e.currentTarget.value).length >= clean(ewn.value).length ? false : null)}
					required
				/>
				<p class="hint {ewMatch === false ? 'text-rose-600' : ewMatch ? 'text-emerald-600' : ''}">
					{ewMatch === false ? 'Nomor tidak sama.' : ewMatch ? '✓ Nomor cocok.' : 'Pastikan benar — pembayaran dikirim ke nomor ini. Tidak bisa ditempel (paste).'}
				</p>
			</div>
		</div>

		<div>
			<span class="label">Akun media sosial</span>
			<p class="mb-2 text-xs text-slate-500">
				Setiap akun akan diverifikasi admin. Akun yang sudah didaftarkan orang lain tidak bisa digunakan.
			</p>
			<AccountRows initial={data.accounts} />
		</div>

		<button class="btn btn-primary w-full" disabled={busy}>{busy ? 'Mengirim…' : 'Kirim Pendaftaran'}</button>
	</form>
</div>
