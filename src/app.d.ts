// Bentuk objek error yang dikirim ke halaman +error.svelte
declare global {
	namespace App {
		interface Error {
			message: string;
			id?: string;
		}
	}
}
export {};
