<script>
	import { ExternalLink } from '@lucide/svelte';
	import { PLATFORMS } from '#lib/constants.js';
	/** Buka profil akun sosmed di tab baru (untuk mengecek akun sebelum/ sesudah verifikasi). icon: hanya ikon */
	let { platform, username, icon = false, small = true, cls = '' } = $props();
	const href = $derived(PLATFORMS[platform]?.profile(username));
</script>

{#if href}
	{#if icon}
		<a {href} target="_blank" rel="noopener noreferrer" class="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-brand-50 hover:text-brand-600 {cls}" title="Buka profil @{username} di {PLATFORMS[platform].label} (tab baru)" aria-label="Buka profil @{username}"><ExternalLink class="size-3.5" /></a>
	{:else}
		<a {href} target="_blank" rel="noopener noreferrer" class="btn btn-secondary {small ? 'btn-sm' : ''} {cls}" title="Buka profil @{username} di {PLATFORMS[platform].label} (tab baru)"><ExternalLink /> Buka profil</a>
	{/if}
{/if}
