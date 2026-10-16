import { deserialize } from '$app/forms';
import { invalidateAll } from '$app/navigation';

/** Daftar notifikasi aktif (ditampilkan oleh Toaster di Shell) */
export const toasts = $state([]);

let seq = 0;
export function toast({ message, tone = 'success', action = null, duration = 7000 }) {
	const id = ++seq;
	toasts.push({ id, message, tone, action, duration });
	setTimeout(() => dismiss(id), duration);
	return id;
}

export function dismiss(id) {
	const i = toasts.findIndex((t) => t.id === id);
	if (i >= 0) toasts.splice(i, 1);
}

/** Panggil form action halaman ini lewat fetch (dipakai tombol "Batalkan") */
async function callAction(name, fields) {
	const fd = new FormData();
	for (const [k, v] of Object.entries(fields)) for (const x of [v].flat()) if (x !== undefined && x !== null) fd.append(k, x);
	const res = await fetch(`?/${name}`, { method: 'POST', body: fd, headers: { 'x-sveltekit-action': 'true', accept: 'application/json' } });
	return deserialize(await res.text());
}

/** Tampilkan notifikasi hasil aksi; bila server mengirim `undo`, beri tombol Batalkan */
export function toastResult(result) {
	const d = result?.data;
	if (!d?.success) return;
	const u = d.undo;
	toast({
		message: d.success,
		action: u
			? {
					label: 'Batalkan',
					run: async () => {
						const r = await callAction(u.action, { id: u.id ?? u.ids, accountId: u.accountIds });
						await invalidateAll();
						if (r.type === 'success') toast({ message: r.data?.success ?? 'Dibatalkan', tone: 'info' });
						else toast({ message: r.data?.error ?? 'Gagal membatalkan', tone: 'error' });
					}
				}
			: null
	});
}
