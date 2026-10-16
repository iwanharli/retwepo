<script>
	import { Popover } from 'bits-ui';
	import { enhance } from '$app/forms';
	import { Bell, CheckCheck, BellOff, ArrowRight } from '@lucide/svelte';
	import { fmtDate } from '#lib/constants.js';
	import NotificationIcon from './NotificationIcon.svelte';

	/** inbox: { items, unread } dari shellData */
	let { inbox } = $props();
	let open = $state(false);
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		class="relative flex size-10 items-center justify-center rounded-full text-slate-500 transition outline-none hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-brand-500/40"
		aria-label="Notifikasi{inbox.unread ? ` (${inbox.unread} belum dibaca)` : ''}"
	>
		<Bell class="size-5" />
		{#if inbox.unread}
			<span class="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
				{inbox.unread > 9 ? '9+' : inbox.unread}
			</span>
		{/if}
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content align="end" sideOffset={8} class="z-50 w-[22rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
			<div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
				<div>
					<div class="text-sm font-semibold">Notifikasi</div>
					<div class="text-xs text-slate-500">{inbox.unread ? `${inbox.unread} belum dibaca` : 'Semua sudah dibaca'}</div>
				</div>
				{#if inbox.unread}
					<form method="POST" action="/app/notifications?/readAll" use:enhance={() => async ({ update }) => update({ invalidateAll: true })}>
						<button class="btn btn-ghost btn-sm text-brand-700"><CheckCheck /> Tandai dibaca</button>
					</form>
				{/if}
			</div>
			{#if inbox.items.length}
				<ul class="max-h-[26rem] divide-y divide-slate-100 overflow-y-auto">
					{#each inbox.items as n (n.id)}
						<li>
							<a
								href="/app/notifications/{n.id}"
								data-sveltekit-reload
								onclick={() => (open = false)}
								class="flex gap-3 px-4 py-3 transition hover:bg-slate-50 {n.read_at ? '' : 'bg-brand-50/40'}"
							>
								<NotificationIcon type={n.type} size={34} />
								<div class="min-w-0 flex-1">
									<div class="text-sm {n.read_at ? 'text-slate-700' : 'font-semibold text-slate-900'}">{n.title}</div>
									{#if n.body}<p class="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.body}</p>{/if}
									<time class="mt-1 block text-[11px] text-slate-400">{fmtDate(n.created_at, true)}</time>
								</div>
								{#if !n.read_at}<span class="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500"></span>{/if}
							</a>
						</li>
					{/each}
				</ul>
			{:else}
				<div class="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-slate-500"><BellOff class="size-7 text-slate-300" />Belum ada notifikasi</div>
			{/if}
			<a href="/app/notifications" onclick={() => (open = false)} class="flex items-center justify-center gap-1.5 border-t border-slate-100 py-3 text-xs font-medium text-brand-700 hover:bg-slate-50">
				Lihat semua notifikasi <ArrowRight class="size-3.5" />
			</a>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
