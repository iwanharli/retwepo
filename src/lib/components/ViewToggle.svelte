<script>
	import { page } from '$app/state';
	import { LayoutGrid, List } from '@lucide/svelte';
	let { view } = $props();
	function href(v) {
		const u = new URL(page.url);
		u.searchParams.set('view', v);
		u.searchParams.delete('page');
		return u.pathname + u.search;
	}
</script>

<div class="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
	{#each [['grid', LayoutGrid, 'Grid'], ['list', List, 'Tabel']] as [v, Icon, lbl]}
		<a
			href={href(v)}
			class="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition {view === v ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}"
			><Icon class="size-3.5" />{lbl}</a
		>
	{/each}
</div>
