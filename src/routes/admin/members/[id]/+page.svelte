<script>
	import UserDetail from '../../users/[id]/+page.svelte';
	let { data, form } = $props();
</script>

<UserDetail {data} {form} />
