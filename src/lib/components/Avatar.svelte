<script>
	let { user, size = 36 } = $props();
	const name = $derived(user.nickname ?? user.email ?? '?');
	const initials = $derived(
		name
			.split(/[\s._@]+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((w) => w[0].toUpperCase())
			.join('')
	);
</script>

{#if user.avatarUrl}
	<img src={user.avatarUrl} alt="" class="shrink-0 rounded-full object-cover ring-2 ring-white" style="width:{size}px;height:{size}px" referrerpolicy="no-referrer" />
{:else}
	<span
		class="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 font-semibold text-white ring-2 ring-white"
		style="width:{size}px;height:{size}px;font-size:{size * 0.38}px">{initials}</span
	>
{/if}
