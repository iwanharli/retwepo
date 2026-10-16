import { EWALLETS } from '#lib/constants.js';

/** Data profil yang wajib diisi sebelum user boleh membuat rekap. Hasil: daftar label yang belum lengkap. */
export function missingProfile(user) {
	const missing = [];
	if (!user.nickname?.trim()) missing.push('Nama panggilan');
	if (!EWALLETS.includes(user.ewalletProvider)) missing.push('Penyedia e-wallet');
	if (!/^(\+62|62|0)8\d{7,12}$/.test(user.ewalletNumber ?? '')) missing.push('Nomor e-wallet');
	return missing;
}
