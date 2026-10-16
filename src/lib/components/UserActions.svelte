<script>
	import { enhance } from '$app/forms';
	import { invalidate, invalidateAll } from '$app/navigation';
	import { toastResult } from '#lib/toast.svelte.js';
	import { page } from '$app/state';
	import { Check, X, UserX, Ban, RotateCcw, ShieldCheck, ShieldOff } from '@lucide/svelte';
	import ActionDialog from './ActionDialog.svelte';
	import UserSummary from './UserSummary.svelte';

	let { u, compact = false } = $props();

	// pertahankan query string (filter/pencarian) saat memanggil form action
	const act = (name) => {
		const q = new URLSearchParams(page.url.search);
		const rest = [...q].length ? `${q}&` : '';
		return `?${rest}/${name}`;
	};

	const after = () => async ({ update }) => {
		await update();
		invalidate('app:pending');
	};

	// setujui: tanpa modal, tapi notifikasi dengan tombol Batalkan
	const approved = () => async ({ result, update }) => {
		if (result.type === 'success') {
			await invalidateAll();
			toastResult(result);
		} else await update();
	};

	const REJECT_PRESETS = ['Username akun tidak ditemukan', 'Akun bukan milik pendaftar', 'Nomor e-wallet tidak valid', 'Data tidak lengkap'];
	const SUSPEND_PRESETS = ['Rekap tidak sesuai / palsu', 'Melanggar ketentuan', 'Tidak aktif dalam waktu lama'];
</script>

<div class="flex flex-wrap gap-1.5 {compact ? 'justify-end' : ''}">
	<!-- user yang ditolak mendaftar ulang sendiri, lalu kembali berstatus menunggu -->
	{#if u.status === 'pending'}
		<form method="POST" action={act('approveUser')} use:enhance={approved}>
			<input type="hidden" name="id" value={u.id} />
			<button class="btn btn-success btn-sm"><Check /> Setujui</button>
		</form>
		<ActionDialog
			action="rejectUser"
			fields={{ id: u.id }}
			tone="danger"
			icon={UserX}
			title="Tolak pendaftaran?"
			description="User akan melihat alasan ini dan bisa memperbaiki data lalu mendaftar ulang. Akun sosmed yang diajukan ikut ditolak."
			confirmLabel="Tolak pendaftaran"
			note={{ label: 'Alasan penolakan', placeholder: 'Jelaskan apa yang perlu diperbaiki…', presets: REJECT_PRESETS, hint: 'Ditampilkan kepada user.', required: true }}
			triggerClass="btn btn-soft-danger btn-sm"
		>
			{#snippet trigger()}<X /> Tolak{/snippet}
			<UserSummary {u} />
		</ActionDialog>
	{/if}

	{#if u.status === 'approved'}
		<ActionDialog
			action="suspendUser"
			fields={{ id: u.id }}
			tone="warning"
			icon={Ban}
			title="Tangguhkan user?"
			description="User langsung keluar dari aplikasi dan tidak bisa login atau membuat rekap sampai diaktifkan kembali. Data rekapnya tetap tersimpan."
			confirmLabel="Tangguhkan"
			note={{ label: 'Alasan penangguhan', placeholder: 'Mis. rekap tidak sesuai bukti…', presets: SUSPEND_PRESETS, hint: 'Ditampilkan kepada user.', required: true }}
			triggerClass="btn btn-soft-warning btn-sm"
		>
			{#snippet trigger()}<Ban /> Tangguhkan{/snippet}
			<UserSummary {u} />
		</ActionDialog>
	{/if}

	{#if u.status === 'suspended'}
		<ActionDialog
			action="reactivateUser"
			fields={{ id: u.id }}
			tone="success"
			icon={RotateCcw}
			title="Aktifkan kembali user?"
			description="User bisa login dan membuat rekap lagi."
			confirmLabel="Aktifkan"
			triggerClass="btn btn-soft-success btn-sm"
		>
			{#snippet trigger()}<RotateCcw /> Aktifkan{/snippet}
			<UserSummary {u} />
			{#if u.status_note ?? u.statusNote}
				<p class="mt-2.5 border-t border-slate-200 pt-2.5 text-xs text-slate-500">Alasan ditangguhkan: {u.status_note ?? u.statusNote}</p>
			{/if}
		</ActionDialog>
	{/if}

	{#if !compact && u.status === 'approved'}
		{#if u.role === 'admin'}
			<ActionDialog
				action="toggleAdmin"
				fields={{ id: u.id }}
				tone="danger"
				icon={ShieldOff}
				title="Cabut hak admin?"
				description="User kembali menjadi member biasa dan tidak bisa membuka panel admin."
				confirmLabel="Cabut hak admin"
				triggerClass="btn btn-soft-danger btn-sm"
			>
				{#snippet trigger()}<ShieldOff /> Cabut admin{/snippet}
				<UserSummary {u} />
			</ActionDialog>
		{:else}
			<ActionDialog
				action="toggleAdmin"
				fields={{ id: u.id }}
				tone="brand"
				icon={ShieldCheck}
				title="Jadikan admin?"
				description="User akan bisa melihat semua data, menyetujui pendaftaran, menghapus rekap, dan mengekspor data."
				confirmLabel="Jadikan admin"
				confirmText={u.email}
				triggerClass="btn btn-soft-brand btn-sm"
			>
				{#snippet trigger()}<ShieldCheck /> Jadikan admin{/snippet}
				<UserSummary {u} />
			</ActionDialog>
		{/if}
	{/if}
</div>
