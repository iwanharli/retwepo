<script>
	import { Link2, ImageIcon, Minus } from '@lucide/svelte';
	import { fmtDate } from '#lib/constants.js';
	import PlatformTag from './PlatformTag.svelte';
	import TypeBadge from './TypeBadge.svelte';
	import CampaignBadge from './CampaignBadge.svelte';
	import EditedBadge from './EditedBadge.svelte';
	import DeletedNotice from './DeletedNotice.svelte';
	import DuplicateBadge from './DuplicateBadge.svelte';
	import SortTh from './SortTh.svelte';
	/** detailBase: awalan URL detail, mis. "/app/recaps" */
	/** sort: { key, dir } urutan aktif (judul kolom bisa diklik) */
	let { rows, showOwner = false, actions = null, detailBase = null, sort = null } = $props();
</script>

<div class="card overflow-x-auto p-0">
	<table class="table table-cards">
		<thead>
			<tr>
				<th class="w-20">Bukti</th>
				<SortTh key="account" label="Akun" {sort} />
				{#if showOwner}<SortTh key="user" label="User" {sort} />{/if}
				<SortTh key="url" label="URL" {sort} />
				<SortTh key="note" label="Catatan" {sort} class="hidden 2xl:table-cell" />
				<SortTh key="posted" label="Waktu posting" {sort} defaultDir="desc" />
				{#if actions}<th class="text-right">Aksi</th>{/if}
			</tr>
		</thead>
		<tbody>
			{#each rows as r (r.id)}
				<tr class={r.deletedAt ? 'bg-rose-50/30' : 'hover:bg-slate-50/70'}>
					<td data-label="Bukti">
						{#if r.screenshotPath}
							<a href={detailBase ? `${detailBase}/${r.id}` : `/uploads/${r.screenshotPath}`} target={detailBase ? undefined : '_blank'} class="block size-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
								<img src="/uploads/{r.screenshotPath}" alt="" loading="lazy" class="size-full object-cover object-top" />
							</a>
						{:else}
							<a href={detailBase ? `${detailBase}/${r.id}` : undefined} class="flex size-12 items-center justify-center rounded-lg border border-dashed border-slate-200 text-slate-300"><ImageIcon class="size-4" /></a>
						{/if}
					</td>
					<td data-label="">
						<PlatformTag platform={r.platform} username={r.username} />
						<div class="mt-1 ml-7 flex flex-wrap gap-1.5"><CampaignBadge name={r.campaign} /><TypeBadge type={r.type} /></div>
					</td>
					{#if showOwner}<td class="whitespace-nowrap" data-label="User">{r.nickname ?? r.email}</td>{/if}
					<td class="max-w-52" data-label="URL">
						{#if r.url}
							<a href={r.url} target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 text-brand-600 hover:underline">
								<Link2 class="size-3.5 shrink-0" /><span class="truncate">{r.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
							</a>
						{:else}<Minus class="size-4 text-slate-300" />{/if}
					</td>
					<td class="hidden max-w-44 truncate text-slate-600 2xl:table-cell" data-label="Catatan">{r.note ?? ''}</td>
					<td class="whitespace-nowrap text-slate-500" data-label="Waktu posting">
						{#if detailBase}<a href="{detailBase}/{r.id}" class="hover:text-brand-600 hover:underline">{fmtDate(r.postedAt, true)}</a>{:else}{fmtDate(r.postedAt, true)}{/if}
						{#if r.editedAt}<div class="mt-0.5"><EditedBadge at={r.editedAt} compact /></div>{/if}
						{#if r.dupCount}<div class="mt-1"><DuplicateBadge count={r.dupCount} /></div>{/if}
						{#if r.deletedAt}<div class="mt-1.5 max-w-60 whitespace-normal"><DeletedNotice {r} compact /></div>{/if}
					</td>
					{#if actions}<td data-cell="actions"><div class="flex items-center justify-end gap-1.5 whitespace-nowrap">{@render actions(r)}</div></td>{/if}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
