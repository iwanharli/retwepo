<script>
	import { onMount } from 'svelte';
	let { option, height = '300px' } = $props();
	let el;
	let chart = $state(null);

	onMount(() => {
		let ro;
		let disposed = false;
		import('echarts').then((echarts) => {
			if (disposed) return;
			chart = echarts.init(el, null, { renderer: 'canvas' });
			ro = new ResizeObserver(() => chart?.resize());
			ro.observe(el);
		});
		return () => {
			disposed = true;
			ro?.disconnect();
			chart?.dispose();
		};
	});

	$effect(() => {
		if (chart && option) chart.setOption(option, true);
	});
</script>

<div bind:this={el} style="height:{height}" class="w-full"></div>
