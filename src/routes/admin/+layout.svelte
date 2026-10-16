<script>
	import Shell from '#lib/components/Shell.svelte';
	let { data, children } = $props();
</script>

<Shell sidebarCollapsed={data.sidebarCollapsed} user={data.me} nav={data.nav} badges={data.badges} inbox={data.inbox}>{@render children()}</Shell>
