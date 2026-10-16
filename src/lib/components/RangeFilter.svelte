<script>
	import { PLATFORMS, PLATFORM_KEYS } from '#lib/constants.js';
	let { from, to, platform = undefined } = $props();

	function preset(days) {
		const fmt = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
		const t = new Date();
		const f = new Date(t.getTime() - (days - 1) * 86400000);
		const u = new URLSearchParams(location.search);
		u.set('from', fmt(f));
		u.set('to', fmt(t));
		return '?' + u.toString();
	}
	const presets = [['Hari ini', 1], ['7 hari', 7], ['30 hari', 30], ['90 hari', 90]];
</script>

<form method="GET" class="flex flex-wrap items-end gap-2">
	<div class="flex gap-1">
		{#each presets as [lbl, n]}
			<button type="button" class="btn btn-secondary btn-sm" onclick={() => (location.href = preset(n))}>{lbl}</button>
		{/each}
	</div>
	<input class="input w-auto" type="date" name="from" value={from} />
	<span class="pb-2 text-slate-400">–</span>
	<input class="input w-auto" type="date" name="to" value={to} />
	{#if platform !== undefined}
		<select class="input w-auto" name="platform" value={platform ?? ''}>
			<option value="">Semua platform</option>
			{#each PLATFORM_KEYS as k}<option value={k}>{PLATFORMS[k].label}</option>{/each}
		</select>
	{/if}
	<button class="btn btn-primary">Terapkan</button>
</form>
