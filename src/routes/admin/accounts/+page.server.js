import { listAccounts } from '#lib/server/social.js';
import { accountActions } from '#lib/server/admin-actions.js';

// Antrian pengajuan akun sosmed tambahan dari user terverifikasi.
// Akun yang diajukan saat pendaftaran ditinjau bersama user-nya di halaman Pendaftaran User.
export function load({ url }) {
	return listAccounts(url, { statuses: ['pending', 'rejected'], defaultStatus: 'pending', defaultSort: { key: 'created', dir: 'asc' }, verifiedUsersOnly: true });
}

export const actions = accountActions;
