<script>
	import { BRAND_PATHS } from '#lib/brand-icons.js';
	import { PLATFORMS } from '#lib/constants.js';
	/** variant: "badge" = logo putih di kotak berwarna, "plain" = logo berwarna */
	let { platform, size = 20, variant = 'badge', class: cls = '' } = $props();
	const color = $derived(PLATFORMS[platform]?.color ?? '#64748b');
</script>

{#if variant === 'badge'}
	<span
		class="inline-flex shrink-0 items-center justify-center rounded-md {cls}"
		style="background:{color};width:{size}px;height:{size}px"
	>
		<svg viewBox="0 0 24 24" fill="#fff" style="width:{size * 0.58}px;height:{size * 0.58}px" aria-hidden="true">
			<path d={BRAND_PATHS[platform]} />
		</svg>
	</span>
{:else}
	<svg viewBox="0 0 24 24" fill={color} class="shrink-0 {cls}" style="width:{size}px;height:{size}px" aria-hidden="true">
		<path d={BRAND_PATHS[platform]} />
	</svg>
{/if}
