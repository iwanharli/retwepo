<script>
	import {
		ArrowLeft,
		Link2,
		CornerDownRight,
		ExternalLink,
		CalendarClock,
		Clock,
		StickyNote,
		ImageOff,
		Maximize2,
		Wallet,
		Download,
		Eye
	} from '@lucide/svelte';
	import { PLATFORMS, ACCOUNT_STATUS, fmtDate } from '#lib/constants.js';
	import PlatformIcon from './PlatformIcon.svelte';
	import TypeBadge from './TypeBadge.svelte';
	import EditedBadge from './EditedBadge.svelte';
	import Badge from './Badge.svelte';
	import Avatar from './Avatar.svelte';
	import Lightbox from './Lightbox.svelte';
	import RecapHistory from './RecapHistory.svelte';
	import DeletedNotice from './DeletedNotice.svelte';
	import DuplicateBadge from './DuplicateBadge.svelte';

	/**
	 * Tampilan detail satu rekap.
	 * r: hasil getRecap(); backHref: tujuan tombol kembali
	 * ownerHref: link ke detail pemilik (admin); actions: tombol aksi (snippet)
	 */
	let { r, history = null, backHref, backLabel = 'Kembali', ownerHref = null, actions = null } = $props();

	let lightbox = $state(false);
	const p = $derived(PLATFORMS[r.platform]);
	const pretty = (u) => u?.replace(/^https?:\/\/(www\.)?/, '');
</script>

<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
	<a href={backHref} class="btn btn-ghost -ml-3"><ArrowLeft /> {backLabel}</a>
	{#if actions}<div class="flex flex-wrap items-center gap-2">{@render actions()}</div>{/if}
</div>

{#if r.deletedAt}<DeletedNotice {r} />{/if}

<div class="grid gap-6 xl:grid-cols-5">
	<!-- Bukti screenshot -->
	<section class="card overflow-hidden p-0 xl:col-span-3">
		<div class="card-header">
			<div class="card-title">Bukti screenshot</div>
			{#if r.screenshotPath}
				<div class="flex gap-1.5">
					<button class="btn btn-ghost btn-sm" onclick={() => (lightbox = true)}><Maximize2 /> Perbesar</button>
					<a href="/uploads/{r.screenshotPath}" download="rekap-{r.id}.webp" class="btn btn-ghost btn-sm"><Download /> Unduh</a>
				</div>
			{/if}
		</div>
		{#if r.screenshotPath}
			<button
				class="group relative block w-full cursor-zoom-in bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#fff_0%_50%)] bg-[length:20px_20px]"
				onclick={() => (lightbox = true)}
				aria-label="Buka screenshot layar penuh"
			>
				<img src="/uploads/{r.screenshotPath}" alt="Screenshot rekap" class="mx-auto max-h-[75vh] w-auto max-w-full object-contain" />
				<span
					class="absolute inset-0 flex items-center justify-center bg-slate-900/0 opacity-0 transition group-hover:bg-slate-900/30 group-hover:opacity-100"
				>
					<span class="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-slate-800 shadow-lg">
						<Maximize2 class="size-4" /> Lihat layar penuh
					</span>
				</span>
			</button>
			<Lightbox
				bind:open={lightbox}
				src="/uploads/{r.screenshotPath}"
				alt="Screenshot rekap @{r.username}"
				title="@{r.username} · {p.label}"
				subtitle={fmtDate(r.postedAt, true)}
				download="rekap-{r.id}.webp"
			/>
		{:else}
			<div class="flex flex-col items-center justify-center gap-2 bg-slate-50 py-24 text-slate-400">
				<ImageOff class="size-10" />
				<p class="text-sm">Rekap ini tidak memiliki screenshot</p>
				{#if r.url}<a href={r.url} target="_blank" rel="noopener noreferrer" class="btn btn-soft-brand btn-sm mt-2"><ExternalLink /> Buka postingan</a>{/if}
			</div>
		{/if}
	</section>

	<!-- Informasi -->
	<aside class="space-y-6 xl:col-span-2">
		<section class="card p-0">
			<div class="flex items-center gap-4 border-b border-slate-100 p-5">
				<PlatformIcon platform={r.platform} size={48} class="rounded-xl" />
				<div class="min-w-0 flex-1">
					<a href={p.profile(r.username)} target="_blank" rel="noopener" class="flex items-center gap-1.5 text-lg font-semibold hover:text-brand-600">
						<span class="truncate">@{r.username}</span><ExternalLink class="size-4 shrink-0 text-slate-400" />
					</a>
					<div class="flex items-center gap-2 text-sm text-slate-500">
						{p.label}
						{#if r.accountStatus && r.accountStatus !== 'approved'}<Badge cls={ACCOUNT_STATUS[r.accountStatus].cls}>akun {ACCOUNT_STATUS[r.accountStatus].label.toLowerCase()}</Badge>{/if}
					</div>
				</div>
				<div class="flex flex-col items-end gap-1.5">
					<TypeBadge type={r.type} />
					<DuplicateBadge count={r.dupCount} />
				</div>
			</div>

			<dl class="divide-y divide-slate-100 text-sm">
				<div class="flex gap-3 px-5 py-3.5">
					<dt class="flex w-36 shrink-0 items-center gap-2 text-slate-500"><CalendarClock class="size-4" /> Waktu posting</dt>
					<dd class="font-medium">{fmtDate(r.postedAt, true)} WIB</dd>
				</div>
				<div class="flex gap-3 px-5 py-3.5">
					<dt class="flex w-36 shrink-0 items-center gap-2 text-slate-500"><Link2 class="size-4" /> URL {r.type === 'reply' ? 'reply' : 'postingan'}</dt>
					<dd class="min-w-0">
						{#if r.url}
							<a href={r.url} target="_blank" rel="noopener noreferrer" class="inline-flex max-w-full items-center gap-1.5 text-brand-600 hover:underline">
								<span class="break-all">{pretty(r.url)}</span><ExternalLink class="size-3.5 shrink-0" />
							</a>
						{:else}<span class="text-slate-400">Tidak diisi</span>{/if}
					</dd>
				</div>
				{#if r.type === 'reply'}
					<div class="flex gap-3 px-5 py-3.5">
						<dt class="flex w-36 shrink-0 items-center gap-2 text-slate-500"><CornerDownRight class="size-4" /> Membalas</dt>
						<dd class="min-w-0">
							{#if r.targetUrl}
								<a href={r.targetUrl} target="_blank" rel="noopener noreferrer" class="inline-flex max-w-full items-center gap-1.5 text-brand-600 hover:underline">
									<span class="break-all">{pretty(r.targetUrl)}</span><ExternalLink class="size-3.5 shrink-0" />
								</a>
							{:else}<span class="text-slate-400">Tidak diisi</span>{/if}
						</dd>
					</div>
				{/if}
				<div class="flex gap-3 px-5 py-3.5">
					<dt class="flex w-36 shrink-0 items-center gap-2 text-slate-500"><StickyNote class="size-4" /> Catatan</dt>
					<dd class="whitespace-pre-line {r.note ? '' : 'text-slate-400'}">{r.note ?? 'Tidak ada catatan'}</dd>
				</div>
				<div class="flex gap-3 px-5 py-3.5">
					<dt class="flex w-36 shrink-0 items-center gap-2 text-slate-500"><Clock class="size-4" /> Dicatat</dt>
					<dd>
						{fmtDate(r.createdAt, true)}
						{#if r.editedAt}<div class="mt-1.5"><EditedBadge at={r.editedAt} /></div>{/if}
					</dd>
				</div>
			</dl>
		</section>

		{#if history}<RecapHistory {history} />{/if}

		{#if ownerHref}
			<!-- Pemilik (admin) -->
			<section class="card p-0">
				<div class="card-header"><div class="card-title">Pemilik rekap</div></div>
				<div class="flex flex-wrap items-center gap-3 p-5">
					<Avatar user={{ nickname: r.nickname, email: r.email, avatarUrl: r.avatarUrl }} size={44} />
					<div class="min-w-0 flex-1">
						<div class="font-medium">{r.nickname ?? '—'}</div>
						<div class="truncate text-sm text-slate-500">{r.email}</div>
					</div>
					{#if r.ewalletNumber}
						<div class="text-right text-xs text-slate-500">
							<div class="flex items-center justify-end gap-1"><Wallet class="size-3.5" />{r.ewalletProvider}</div>
							<div class="font-mono text-sm text-slate-700">{r.ewalletNumber}</div>
						</div>
					{/if}
				</div>
				<div class="border-t border-slate-100 px-5 py-3"><a href={ownerHref} class="btn btn-soft-brand btn-sm shrink-0 w-full justify-center" title="Lihat detail"><Eye /> Detail user</a></div>
			</section>
		{/if}
	</aside>
</div>
