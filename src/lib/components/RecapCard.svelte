<script>
	import { Link2, CornerDownRight, ImageOff, Clock, StickyNote, Eye } from '@lucide/svelte';
	import { fmtDate } from '#lib/constants.js';
	import PlatformTag from './PlatformTag.svelte';
	import TypeBadge from './TypeBadge.svelte';
	import CampaignBadge from './CampaignBadge.svelte';
	import EditedBadge from './EditedBadge.svelte';
	import DeletedNotice from './DeletedNotice.svelte';
	import DuplicateBadge from './DuplicateBadge.svelte';
	/** href: link ke halaman detail rekap */
	let { r, owner = null, href = null, children = null } = $props();
	const shot = $derived(r.screenshotPath ?? r.screenshot_path);
	const at = $derived(r.postedAt ?? r.posted_at);
	const target = $derived(r.targetUrl ?? r.target_url);
	const edited = $derived(r.editedAt ?? r.edited_at);
	const host = (u) => {
		try {
			const x = new URL(u);
			return x.host.replace(/^www\./, '') + x.pathname;
		} catch {
			return u;
		}
	};
</script>

<article class="group flex flex-col overflow-hidden rounded-xl border bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-md {r.deletedAt ? 'border-rose-200' : 'border-slate-200/80'}">
	{#if shot}
		<a href={href ?? `/uploads/${shot}`} target={href ? undefined : '_blank'} class="relative block aspect-[16/10] overflow-hidden bg-slate-100">
			<img src="/uploads/{shot}" alt="screenshot" loading="lazy" class="size-full object-cover object-top transition duration-300 group-hover:scale-[1.03] {r.deletedAt ? 'opacity-50 grayscale' : ''}" />
		</a>
	{:else}
		<a href={href} class="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-300">
			<ImageOff class="size-8" />
		</a>
	{/if}
	<div class="flex flex-1 flex-col gap-2.5 p-4">
		<div class="flex items-center justify-between gap-2">
			<PlatformTag platform={r.platform} username={r.username} />
			<span class="flex shrink-0 items-center gap-1.5"><CampaignBadge name={r.campaign} /><TypeBadge type={r.type} /></span>
		</div>
		{#if r.deletedAt}<DeletedNotice {r} compact />{/if}
		{#if owner || edited || r.dupCount}
			<div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
				{#if owner}<span>oleh <b class="text-slate-700">{owner}</b></span>{/if}
				<EditedBadge at={edited} />
				<DuplicateBadge count={r.dupCount} />
			</div>
		{/if}
		{#if r.url}
			<a href={r.url} target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 text-sm text-brand-600 hover:underline">
				<Link2 class="size-3.5 shrink-0" /><span class="truncate">{host(r.url)}</span>
			</a>
		{/if}
		{#if target}
			<a href={target} target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 text-xs text-slate-500 hover:underline">
				<CornerDownRight class="size-3.5 shrink-0" /><span class="truncate">membalas {host(target)}</span>
			</a>
		{/if}
		{#if r.note}
			<p class="flex gap-1.5 text-sm text-slate-600"><StickyNote class="mt-0.5 size-3.5 shrink-0 text-slate-400" /><span class="line-clamp-2">{r.note}</span></p>
		{/if}
		<div class="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
			{#if href}
				<a {href} class="flex items-center gap-1 hover:text-brand-600 hover:underline"><Clock class="size-3.5" />{fmtDate(at, true)}</a>
			{:else}
				<span class="flex items-center gap-1"><Clock class="size-3.5" />{fmtDate(at, true)}</span>
			{/if}
			<div class="flex flex-wrap items-center justify-end gap-1.5">
				{#if children}
					{@render children()}
				{:else if href}
					<a {href} class="btn btn-secondary btn-sm"><Eye /> Detail</a>
				{/if}
			</div>
		</div>
	</div>
</article>
