import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (v) => v || undefined;

export const variables = defineEnvVars({
	DATABASE_URL: { description: 'Koneksi PostgreSQL' },
	ORIGIN: { schema: optional, description: 'URL publik aplikasi, mis. https://rekap.domain.com' },
	GOOGLE_CLIENT_ID: { schema: optional, description: 'Google OAuth Client ID' },
	GOOGLE_CLIENT_SECRET: { schema: optional, description: 'Google OAuth Client Secret' },
	EWALLET_CHECK_URL: {
		schema: optional,
		description: 'Endpoint cek nama pemilik e-wallet (opsional). Placeholder: {provider} {number} {number62}'
	},
	EWALLET_CHECK_TOKEN: { schema: optional, description: 'Token Authorization: Bearer untuk endpoint cek e-wallet (opsional)' },
	EWALLET_CHECK_NAME_PATH: { schema: optional, description: 'Lokasi nama di JSON respons, mis. data.account_name (default: dicari otomatis)' },
	UPLOAD_DIR: { schema: (v) => v || './uploads', description: 'Folder penyimpanan screenshot' }
});
