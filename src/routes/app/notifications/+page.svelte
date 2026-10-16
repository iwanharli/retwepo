<script>
	import { enhance } from '$app/forms';
	import { Bell, CheckCheck, BellOff } from '@lucide/svelte';
	import { fmtDate, fmtNum } from '#lib/constants.js';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import NotificationIcon from '#lib/components/NotificationIcon.svelte';
	let { data } = $props();
</script>

<svelte:head><title>Notifikasi · Retwepo</title></svelte:head>

<PageHeader title="Notifikasi" description="Pemberitahuan tentang rekap, akun sosmed, dan status akun Anda." icon={Bell}>
	{#snippet actions()}
		<form method="POST" action="?/readAll" use:enhance={() => async ({ update }) => update({ invalidateAll: true })}>
			<button class="btn btn-secondary"><CheckCheck /> Tandai semua dibaca</button>
		</form>
	{/snippet}
</PageHeader>

<div class="mb-4 flex gap-1.5">
	{#each [[false, 'Semua'], [true, 'Belum dibaca']] as [u, lbl]}
		<a
			href={u ? '?filter=unread' : '?'}
			class="inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition {data.unreadOnly === u
				? 'bg-slate-900 text-white'
				: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}">{lbl}</a
		>
	{/each}
</div>

{#if data.rows.length}
	<div class="card p-0">
		<ul class="divide-y divide-slate-100">
			{#each data.rows as n (n.id)}
				<li>
					<a href="/app/notifications/{n.id}" data-sveltekit-reload class="flex gap-4 px-5 py-4 transition hover:bg-slate-50 {n.readAt ? '' : 'bg-brand-50/40'}">
						<NotificationIcon type={n.type} size={40} />
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-baseline justify-between gap-x-4">
								<span class="{n.readAt ? 'text-slate-700' : 'font-semibold text-slate-900'}">{n.title}</span>
								<time class="text-xs text-slate-400">{fmtDate(n.createdAt, true)}</time>
							</div>
							{#if n.body}<p class="mt-1 text-sm text-slate-600">{n.body}</p>{/if}
						</div>
						{#if !n.readAt}<span class="mt-2 size-2 shrink-0 rounded-full bg-brand-500" title="Belum dibaca"></span>{/if}
					</a>
				</li>
			{/each}
		</ul>
	</div>
	<Pagination current={data.page} total={data.total} perPage={data.perPage} />
{:else}
	<EmptyState icon={BellOff} title={data.unreadOnly ? 'Tidak ada notifikasi baru' : 'Belum ada notifikasi'} description="Pemberitahuan dari admin akan muncul di sini." />
{/if}
