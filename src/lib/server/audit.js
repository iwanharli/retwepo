import { db } from './db/index.js';
import { adminLogs } from './db/schema.js';

/**
 * Catat aksi admin. Dipanggil setelah aksi berhasil.
 * entries: satu objek atau array { action, targetType, targetId, targetLabel, note, meta }
 */
export async function logAdmin(admin, entries, tx = db) {
	const list = (Array.isArray(entries) ? entries : [entries]).filter(Boolean);
	if (!list.length) return;
	await tx.insert(adminLogs).values(list.map((e) => ({ ...e, adminId: admin.id })));
}

/** Label & warna tiap jenis aksi (dipakai halaman log) */
export const LOG_ACTIONS = {
	approveUser: 'Menyetujui user',
	createUser: 'Membuat user',
	editUserProfile: 'Mengubah profil user',
	rejectUser: 'Menolak pendaftaran',
	suspendUser: 'Menangguhkan user',
	reactivateUser: 'Mengaktifkan kembali user',
	grantAdmin: 'Menjadikan admin',
	revokeAdmin: 'Mencabut hak admin',
	approveAccount: 'Menyetujui akun sosmed',
	addAccount: 'Menambahkan akun sosmed',
	rejectAccount: 'Menolak akun sosmed',
	revokeAccount: 'Mencabut verifikasi akun',
	deleteRecap: 'Menghapus rekap',
	restoreRecap: 'Memulihkan rekap',
	purgeRecaps: 'Membersihkan rekap lama',
	undoApproveUser: 'Membatalkan persetujuan user',
	undoApproveAccount: 'Membatalkan persetujuan akun',
	createCampaign: 'Menambah kampanye',
	renameCampaign: 'Mengganti nama kampanye',
	closeCampaign: 'Menutup kampanye',
	openCampaign: 'Membuka kembali kampanye'
};
