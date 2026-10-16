<script>
	import { PLATFORMS } from '#lib/constants.js';
	import PlatformIcon from './PlatformIcon.svelte';
	let { platform, username = null, link = false, size = 20 } = $props();
	const p = $derived(PLATFORMS[platform]);
</script>

<span class="inline-flex min-w-0 items-center gap-2 text-sm">
	<PlatformIcon {platform} {size} />
	{#if username}
		{#if link}
			<a href={p.profile(username)} target="_blank" rel="noopener" class="truncate font-medium hover:text-brand-600 hover:underline">@{username}</a>
		{:else}
			<span class="truncate font-medium">@{username}</span>
		{/if}
	{:else}
		<span class="truncate">{p?.label}</span>
	{/if}
</span>
