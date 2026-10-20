<script>
	import { Link2, CornerDownRight, ImageOff, Clock, Eye } from '@lucide/svelte';
	import { fmtDate, PLATFORMS } from '#lib/constants.js';
	import PlatformIcon from './PlatformIcon.svelte';
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
	<!-- bukti + label kampanye & tipe melayang di atasnya -->
	<div class="relative">
		{#if shot}
			<a href={href ?? `/uploads/${shot}`} target={href ? undefined : '_blank'} class="block aspect-[16/10] overflow-hidden bg-slate-100">
				<img src="/uploads/{shot}" alt="screenshot" loading="lazy" class="size-full object-cover object-top transition duration-300 group-hover:scale-[1.03] {r.deletedAt ? 'opacity-50 grayscale' : ''}" />
			</a>
		{:else}
			<a href={href} class="flex aspect-[16/10] flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-300">
				<ImageOff class="size-8" /><span class="text-xs text-slate-400">Tanpa screenshot</span>
			</a>
		{/if}
		<div class="pointer-events-none absolute inset-x-2.5 top-2.5 flex flex-wrap items-start justify-between gap-1.5">
			{#if r.campaign}<span class="rounded-md shadow-sm [&>span]:bg-white/95 [&>span]:backdrop-blur"><CampaignBadge name={r.campaign} /></span>{:else}<span></span>{/if}
			<span class="rounded-md shadow-sm [&>span]:bg-white/95 [&>span]:backdrop-blur"><TypeBadge type={r.type} /></span>
		</div>
	</div>

	<div class="flex flex-1 flex-col gap-3 p-4">
		<!-- akun & pemilik: tidak dipotong, boleh turun baris -->
		<div class="flex items-start gap-3">
			<PlatformIcon platform={r.platform} size={36} />
			<div class="min-w-0 flex-1">
				<div class="text-sm font-semibold break-all text-slate-900">@{r.username}</div>
				<div class="text-xs text-slate-500">
					{PLATFORMS[r.platform]?.label}{#if owner} · oleh <b class="font-medium text-slate-700">{owner}</b>{/if}
				</div>
			</div>
		</div>
		{#if r.deletedAt}<DeletedNotice {r} compact />{/if}
		{#if edited || r.dupCount}
			<div class="flex flex-wrap items-center gap-2 text-xs"><EditedBadge at={edited} /><DuplicateBadge count={r.dupCount} /></div>
		{/if}
		{#if r.url}
			<a href={r.url} target="_blank" rel="noopener noreferrer" class="flex items-start gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-brand-600 hover:bg-brand-50 hover:underline">
				<Link2 class="mt-px size-3.5 shrink-0" /><span class="break-all">{host(r.url)}</span>
			</a>
		{/if}
		{#if target}
			<a href={target} target="_blank" rel="noopener noreferrer" class="flex items-start gap-1.5 text-xs text-slate-500 hover:underline">
				<CornerDownRight class="mt-px size-3.5 shrink-0" /><span class="break-all">target: {host(target)}</span>
			</a>
		{/if}
		<div class="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
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
