<script>
	import { History, ArrowRight, ImageIcon, MessageSquareQuote } from '@lucide/svelte';
	import { PLATFORMS, RECAP_TYPES, fmtDate } from '#lib/constants.js';
	import Lightbox from './Lightbox.svelte';

	/** history: { edits, accounts } dari getRecapEdits() */
	let { history } = $props();

	const FIELDS = {
		socialAccountId: 'Akun',
		type: 'Tipe',
		url: 'URL',
		targetUrl: 'URL dibalas',
		note: 'Catatan',
		postedAt: 'Waktu posting',
		screenshotPath: 'Screenshot'
	};

	function show(key, v) {
		if (v === null || v === undefined || v === '') return '—';
		if (key === 'socialAccountId') {
			const a = history.accounts[v];
			return a ? `${PLATFORMS[a.platform].label} @${a.username}` : `#${v}`;
		}
		if (key === 'type') return RECAP_TYPES[v] ?? v;
		if (key === 'postedAt') return fmtDate(v, true);
		return String(v).replace(/^https?:\/\/(www\.)?/, '');
	}

	const changes = (e) => Object.keys(FIELDS).filter((k) => JSON.stringify(e.before[k]) !== JSON.stringify(e.after[k]));

	let lb = $state({ open: false, src: '', title: '' });
	const openShot = (path, title) => (lb = { open: true, src: `/uploads/${path}`, title });
</script>

{#if history.edits.length}
	<section class="card p-0">
		<div class="card-header">
			<div class="card-title"><History /> Riwayat perubahan</div>
			<span class="text-xs text-slate-500">{history.edits.length}× diedit</span>
		</div>
		<ol class="relative space-y-0 p-5">
			{#each history.edits as e, i (e.id)}
				<li class="relative pb-6 pl-7 last:pb-0">
					{#if i < history.edits.length - 1}<span class="absolute top-3 bottom-0 left-[7px] w-px bg-slate-200"></span>{/if}
					<span class="absolute top-1.5 left-0 size-[15px] rounded-full border-2 border-white bg-amber-400 ring-1 ring-amber-200"></span>
					<div class="text-xs text-slate-500">{fmtDate(e.createdAt, true)}</div>
					<p class="mt-1 flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
						<MessageSquareQuote class="mt-0.5 size-4 shrink-0 text-amber-500" />{e.reason}
					</p>
					<ul class="mt-2.5 space-y-1.5 text-sm">
						{#each changes(e) as k}
							<li class="grid grid-cols-[6.5rem_1fr] gap-2">
								<span class="text-slate-500">{FIELDS[k]}</span>
								{#if k === 'screenshotPath'}
									<span class="flex flex-wrap items-center gap-2">
										{#if e.before[k]}
											<button class="btn btn-secondary btn-sm" onclick={() => openShot(e.before[k], `Screenshot sebelum · ${fmtDate(e.createdAt, true)}`)}><ImageIcon /> Lama</button>
										{:else}<span class="text-slate-400">tidak ada</span>{/if}
										<ArrowRight class="size-3.5 text-slate-400" />
										{#if e.after[k]}
											<button class="btn btn-secondary btn-sm" onclick={() => openShot(e.after[k], `Screenshot sesudah · ${fmtDate(e.createdAt, true)}`)}><ImageIcon /> Baru</button>
										{:else}<span class="text-rose-600">dihapus</span>{/if}
									</span>
								{:else}
									<span class="min-w-0 break-words">
										<span class="text-slate-400 line-through">{show(k, e.before[k])}</span>
										<ArrowRight class="mx-1 inline size-3.5 text-slate-400" />
										<span class="font-medium text-slate-900">{show(k, e.after[k])}</span>
									</span>
								{/if}
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ol>
	</section>
	<Lightbox bind:open={lb.open} src={lb.src} title={lb.title} alt={lb.title} />
{/if}
