<script>
	import PlatformTag from './PlatformTag.svelte';
	/** Ringkasan satu atau beberapa akun sosmed di dalam modal aksi. accounts: [{ platform, username, nickname?, email? }] */
	let { accounts } = $props();
	const shown = $derived(accounts.slice(0, 6));
</script>

<ul class="space-y-2">
	{#each shown as a}
		<li class="flex items-center justify-between gap-3">
			<PlatformTag platform={a.platform} username={a.username} size={24} />
			{#if a.nickname || a.email}<span class="truncate text-xs text-slate-500">{a.nickname ?? a.email}</span>{/if}
		</li>
	{/each}
</ul>
{#if accounts.length > shown.length}
	<p class="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-500">+ {accounts.length - shown.length} akun lainnya</p>
{/if}
