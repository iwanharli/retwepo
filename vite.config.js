import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: { port: 5180, strictPort: true },
	preview: { port: 5180, strictPort: true },
	plugins: [
		tailwindcss(),
		sveltekit({
			// BUILD_OUT: folder hasil build (deploy membangun ke folder lain dulu, lalu ditukar sekaligus)
			adapter: adapter({ bodySize: '12M', out: process.env.BUILD_OUT || 'build' })
		})
	]
});
