<script>
	import { Dialog } from 'bits-ui';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { Plus, X, Search, AtSign, BadgeCheck, LoaderCircle, CircleAlert, Check } from '@lucide/svelte';
	import { PLATFORMS, PLATFORM_KEYS } from '#lib/constants.js';
	import { toastResult } from '#lib/toast.svelte.js';
	import Avatar from './Avatar.svelte';
	import PlatformIcon from './PlatformIcon.svelte';

	/**
	 * Admin menambahkan akun sosmed untuk user (langsung terverifikasi).
	 * user: bila diisi, user sudah ditentukan (halaman detail user); jika tidak, admin mencari user
	 */
	let { user = null, triggerClass = 'btn btn-primary' } = $props();

	let open = $state(false);
	let selected = $state(null);
	let q = $state('');
	let results = $state([]);
	let searching = $state(false);
	let platform = $state('twitter');
	let username = $state('');
	let busy = $state(false);
	let error = $state('');
	let timer;

	const target = $derived(user ?? selected);
	const canSubmit = $derived(Boolean(target && username.trim()));
	const actionUrl = $derived.by(() => {
		const s = new URLSearchParams(page.url.search);
		return `?${[...s].length ? `${s}&` : ''}/addAccount`;
	});

	function reset() {
		selected = null;
		q = '';
		results = [];
		username = '';
		platform = 'twitter';
		error = '';
		if (!user) search('');
	}

	function search(v) {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			searching = true;
			try {
				results = await (await fetch(`/admin/api/users?q=${encodeURIComponent(v)}`)).json();
			} finally {
				searching = false;
			}
		}, 200);
	}

	const submit = () => {
		busy = true;
		error = '';
		return async ({ result }) => {
			busy = false;
			if (result.type === 'success') {
				open = false;
				await invalidateAll();
				toastResult(result);
			} else error = result.data?.error ?? 'Gagal menambahkan akun';
		};
	};
</script>

<Dialog.Root bind:open onOpenChange={(v) => v && reset()}>
	<Dialog.Trigger class={triggerClass}><Plus /> Tambah akun</Dialog.Trigger>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
		>
			<form method="POST" action={actionUrl} use:enhance={submit} class="flex min-h-0 flex-1 flex-col">
				<div class="flex gap-4 border-b border-slate-100 p-6 pb-5">
					<span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50"><BadgeCheck class="size-5" /></span>
					<div class="flex-1">
						<Dialog.Title class="text-base font-semibold text-slate-900">Tambah akun sosmed</Dialog.Title>
						<Dialog.Description class="mt-1 text-sm text-slate-500">Akun langsung terverifikasi tanpa antrian pengajuan. User akan menerima notifikasi.</Dialog.Description>
					</div>
					<Dialog.Close class="btn btn-ghost btn-icon -mt-1 -mr-2 size-8" aria-label="Tutup"><X /></Dialog.Close>
				</div>

				<div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
					<!-- 1. User -->
					<section>
						<span class="label">Pemilik akun</span>
						{#if target}
							<input type="hidden" name="userId" value={target.id} />
							<div class="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/50 p-3">
								<Avatar user={{ nickname: target.nickname, email: target.email, avatarUrl: target.avatar_url ?? target.avatarUrl }} size={36} />
								<div class="min-w-0 flex-1">
									<div class="truncate text-sm font-medium">{target.nickname ?? '—'}</div>
									<div class="truncate text-xs text-slate-500">{target.email}</div>
								</div>
								{#if (target.accounts ?? []).length}
									<div class="flex gap-1">{#each target.accounts as a}<span title="@{a.username}"><PlatformIcon platform={a.platform} size={20} /></span>{/each}</div>
								{/if}
								{#if !user}<button type="button" class="btn btn-ghost btn-sm" onclick={() => (selected = null)}>Ganti</button>{/if}
							</div>
						{:else}
							<div class="relative">
								<Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
								<input class="input pl-9" placeholder="Cari nama atau email user terverifikasi…" bind:value={q} oninput={() => search(q)} autocomplete="off" />
								{#if searching}<LoaderCircle class="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-slate-400" />{/if}
							</div>
							<ul class="mt-2 max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
								{#each results as r (r.id)}
									<li>
										<button type="button" class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50" onclick={() => (selected = r)}>
											<Avatar user={{ nickname: r.nickname, email: r.email, avatarUrl: r.avatar_url }} size={30} />
											<span class="min-w-0 flex-1">
												<span class="block truncate text-sm font-medium">{r.nickname ?? '—'}</span>
												<span class="block truncate text-xs text-slate-500">{r.email}</span>
											</span>
											<span class="flex gap-1">{#each r.accounts ?? [] as a}<PlatformIcon platform={a.platform} size={18} />{/each}</span>
										</button>
									</li>
								{:else}
									<li class="px-3 py-6 text-center text-sm text-slate-500">{searching ? 'Mencari…' : 'Tidak ada user yang cocok'}</li>
								{/each}
							</ul>
						{/if}
					</section>

					<!-- 2. Akun -->
					<section>
						<span class="label">Platform</span>
						<div class="grid grid-cols-5 gap-2">
							{#each PLATFORM_KEYS as k}
								<label
									class="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-2.5 text-[11px] font-medium transition {platform === k
										? 'border-brand-500 bg-brand-50/50 ring-4 ring-brand-500/10'
										: 'border-slate-200 text-slate-600 hover:bg-slate-50'}"
									title={PLATFORMS[k].label}
								>
									<input type="radio" name="platform" value={k} bind:group={platform} class="sr-only" />
									<PlatformIcon platform={k} size={28} />
									<span class="truncate">{PLATFORMS[k].short === 'X' ? 'X' : PLATFORMS[k].label}</span>
								</label>
							{/each}
						</div>
					</section>
					<section>
						<label class="label" for="add-username">Username</label>
						<div class="relative">
							<AtSign class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
							<input id="add-username" name="username" class="input pl-9" placeholder="username atau URL profil" bind:value={username} autocomplete="off" />
						</div>
						<p class="hint">Username yang sudah dipakai user lain akan ditolak.</p>
					</section>

					{#if error}
						<div class="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700"><CircleAlert class="mt-0.5 size-4 shrink-0" />{error}</div>
					{/if}
				</div>

				<div class="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
					<Dialog.Close type="button" class="btn btn-secondary">Batal</Dialog.Close>
					<button class="btn btn-success" disabled={!canSubmit || busy}>
						{#if busy}<LoaderCircle class="animate-spin" /> Menyimpan…{:else}<Check /> Tambah & verifikasi{/if}
					</button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
