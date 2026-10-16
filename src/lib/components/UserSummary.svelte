<script>
	import Avatar from './Avatar.svelte';
	import PlatformIcon from './PlatformIcon.svelte';
	/** Ringkasan user di dalam modal aksi */
	let { u } = $props();
	const accounts = $derived((u.accounts ?? []).filter((a) => a.status !== 'rejected'));
</script>

<div class="flex items-center gap-3">
	<Avatar user={{ nickname: u.nickname, email: u.email, avatarUrl: u.avatar_url ?? u.avatarUrl }} size={40} />
	<div class="min-w-0 flex-1">
		<div class="truncate font-medium text-slate-900">{u.nickname ?? '—'}</div>
		<div class="truncate text-xs text-slate-500">{u.email}</div>
	</div>
	{#if accounts.length}
		<div class="flex shrink-0 gap-1">
			{#each accounts as a}<span title="@{a.username}"><PlatformIcon platform={a.platform} size={22} /></span>{/each}
		</div>
	{/if}
</div>
