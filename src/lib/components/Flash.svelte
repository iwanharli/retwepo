<script>
	import { CircleCheck, CircleAlert, X } from '@lucide/svelte';
	let { form } = $props();
	let hidden = $state(null);
	const msg = $derived(form?.error ?? form?.success ?? null);
</script>

{#if msg && hidden !== form}
	<div
		role="status"
		class="mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm {form.error
			? 'border-rose-200 bg-rose-50 text-rose-800'
			: 'border-emerald-200 bg-emerald-50 text-emerald-800'}"
	>
		{#if form.error}<CircleAlert class="mt-0.5 size-4 shrink-0" />{:else}<CircleCheck class="mt-0.5 size-4 shrink-0" />{/if}
		<span class="flex-1">{msg}</span>
		<button class="opacity-60 hover:opacity-100" onclick={() => (hidden = form)} aria-label="Tutup"><X class="size-4" /></button>
	</div>
{/if}
