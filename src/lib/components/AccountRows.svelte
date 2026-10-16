<script>
	import { untrack } from 'svelte';
	import { Plus, X, AtSign } from '@lucide/svelte';
	import { PLATFORMS, PLATFORM_KEYS } from '#lib/constants.js';
	import PlatformIcon from './PlatformIcon.svelte';
	let { initial = [] } = $props();
	// nilai awal saja; setelah itu baris dikelola sendiri oleh komponen
	let rows = $state(untrack(() => (initial.length ? initial.map((r) => ({ ...r })) : [{ platform: 'twitter', username: '' }])));
</script>

<div class="space-y-2.5">
	{#each rows as row, i (i)}
		<div class="flex gap-2">
			<div class="relative w-44 shrink-0">
				<span class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"><PlatformIcon platform={row.platform} size={20} /></span>
				<select class="input pl-10" name="platform" bind:value={row.platform}>
					{#each PLATFORM_KEYS as k}<option value={k}>{PLATFORMS[k].label}</option>{/each}
				</select>
			</div>
			<div class="relative min-w-0 flex-1">
				<AtSign class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
				<input class="input pl-9" name="username" placeholder="username atau URL profil" bind:value={row.username} autocomplete="off" />
			</div>
			{#if rows.length > 1}
				<button type="button" class="btn btn-ghost btn-icon h-10 shrink-0 text-slate-400 hover:text-rose-600" aria-label="Hapus baris" onclick={() => rows.splice(i, 1)}><X /></button>
			{/if}
		</div>
	{/each}
	<button type="button" class="btn btn-soft-brand btn-sm" onclick={() => rows.push({ platform: 'instagram', username: '' })}>
		<Plus /> Tambah baris
	</button>
</div>
