import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (v) => v || undefined;

export const variables = defineEnvVars({
	DATABASE_URL: { description: 'Koneksi PostgreSQL' },
	ORIGIN: { schema: optional, description: 'URL publik aplikasi, mis. https://rekap.domain.com' },
	GOOGLE_CLIENT_ID: { schema: optional, description: 'Google OAuth Client ID' },
	GOOGLE_CLIENT_SECRET: { schema: optional, description: 'Google OAuth Client Secret' },
	UPLOAD_DIR: { schema: (v) => v || './uploads', description: 'Folder penyimpanan screenshot' }
});
