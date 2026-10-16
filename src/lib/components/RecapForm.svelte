<script>
	import { enhance } from '$app/forms';
	import {
		FileText,
		Reply,
		Link2,
		CornerDownRight,
		ImageUp,
		ClipboardPaste,
		Trash2,
		CalendarClock,
		StickyNote,
		Send,
		Save,
		LoaderCircle,
		Info,
		Check
	} from '@lucide/svelte';
	import { untrack, tick } from 'svelte';
	import { PLATFORMS } from '#lib/constants.js';
	import PlatformIcon from './PlatformIcon.svelte';
	import DuplicateNotice from './DuplicateNotice.svelte';
	import { Copy } from '@lucide/svelte';

	/**
	 * Form rekap untuk halaman tambah (mode "new") dan edit (mode "edit").
	 * initial: { accountId, type, url, targetUrl, note, postedAt (YYYY-MM-DDTHH:mm WIB), screenshotPath }
	 */
	/** recapId: id rekap yang sedang diedit (dikecualikan saat cek duplikat) */
	let { accounts, form = null, mode = 'new', initial = {}, recapId = null } = $props();

	function nowLocal() {
		return new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 16); // WIB
	}

	// nilai awal saja; setelah itu dikendalikan oleh input
	let accountId = $state(untrack(() => form?.keep?.accountId ?? initial.accountId ?? accounts[0]?.id ?? ''));
	let type = $state(untrack(() => form?.keep?.type ?? initial.type ?? 'post'));
	let postedAt = $state(untrack(() => initial.postedAt ?? nowLocal()));
	let url = $state(untrack(() => initial.url ?? ''));
	let removeShot = $state(false); // edit: hapus screenshot lama
	let editReason = $state(''); // edit: alasan perubahan (wajib)
	const reasonOk = $derived(mode !== 'edit' || editReason.trim().length >= 5);
	let preview = $state(null);
	let fileName = $state('');
	let dragging = $state(false);
	let busy = $state(false);
	let fileInput = $state();
	let formEl = $state();

	// ---- cek URL duplikat selagi user mengetik
	let dup = $state(null);
	let allowDup = $state(false);
	let dupTimer;
	$effect(() => {
		const v = url.trim();
		allowDup = false;
		clearTimeout(dupTimer);
		if (!/^https?:\/\/\S+\.\S+/.test(v)) return void (dup = null);
		dupTimer = setTimeout(async () => {
			const res = await fetch(`/app/recaps/check-url?url=${encodeURIComponent(v)}${recapId ? `&exclude=${recapId}` : ''}`);
			if (res.ok) dup = await res.json();
		}, 400);
	});
	// server menolak karena duplikat → tampilkan konfirmasi
	const serverDup = $derived(form?.duplicate ?? null);
	function saveAnyway() {
		allowDup = true;
		tick().then(() => formEl.requestSubmit());
	}

	const shownExisting = $derived(Boolean(initial.screenshotPath) && !removeShot && !preview);
	const hasEvidence = $derived(Boolean(url.trim() || preview || shownExisting));

	function setFile(file) {
		if (!file) return;
		const dt = new DataTransfer();
		dt.items.add(file);
		fileInput.files = dt.files;
		showPreview();
	}

	function showPreview() {
		if (preview) URL.revokeObjectURL(preview);
		const f = fileInput.files?.[0];
		preview = f ? URL.createObjectURL(f) : null;
		fileName = f ? `${f.name || 'tempelan.png'} · ${(f.size / 1024).toFixed(0)} KB` : '';
	}

	function clearFile() {
		fileInput.value = '';
		showPreview();
	}

	function removeAnyShot() {
		if (preview) clearFile();
		else removeShot = true;
	}

	function onPaste(e) {
		const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith('image/'));
		if (item) {
			e.preventDefault();
			setFile(item.getAsFile());
		}
	}

	function onDrop(e) {
		e.preventDefault();
		dragging = false;
		const f = e.dataTransfer?.files?.[0];
		if (f?.type.startsWith('image/')) setFile(f);
	}
</script>

<svelte:window onpaste={onPaste} />

<form
	bind:this={formEl}
	method="POST"
	enctype="multipart/form-data"
	use:enhance={() => {
		busy = true;
		return async ({ result, update }) => {
			await update({ reset: false });
			if (result.type === 'success' && mode === 'new') {
				formEl.querySelectorAll('input[type=url], textarea').forEach((el) => (el.value = ''));
				url = '';
				clearFile();
				postedAt = nowLocal();
			}
			if (result.type === 'success' && mode === 'edit') {
				removeShot = false;
				editReason = '';
				clearFile();
			}
			busy = false;
		};
	}}
	class="grid gap-6 xl:grid-cols-5"
>
	<!-- Kolom kiri: data rekap -->
	<div class="space-y-6 xl:col-span-3">
		<section class="card p-0">
			<div class="card-header"><div class="card-title">1. Pilih akun</div></div>
			<div class="grid gap-3 p-5 sm:grid-cols-2 2xl:grid-cols-3">
				{#each accounts as a}
					<label
						class="relative flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition {accountId == a.id
							? 'border-brand-500 bg-brand-50/50 ring-4 ring-brand-500/10'
							: 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}"
					>
						<input type="radio" name="accountId" value={a.id} bind:group={accountId} class="sr-only" />
						<PlatformIcon platform={a.platform} size={36} />
						<div class="min-w-0">
							<div class="truncate text-sm font-semibold">@{a.username}</div>
							<div class="text-xs text-slate-500">{PLATFORMS[a.platform].label}</div>
						</div>
						{#if accountId == a.id}
							<span class="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-brand-600 text-white"><Check class="size-3" /></span>
						{/if}
					</label>
				{/each}
			</div>
		</section>

		<section class="card p-0">
			<div class="card-header"><div class="card-title">2. Detail rekap</div></div>
			<div class="space-y-5 p-5">
				<div>
					<span class="label">Tipe</span>
					<div class="grid grid-cols-2 gap-3">
						{#each [['post', 'Postingan', 'Konten yang Anda unggah sendiri', FileText], ['reply', 'Reply', 'Balasan / komentar di postingan lain', Reply]] as [val, lbl, desc, Icon]}
							<label
								class="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition {type === val
									? 'border-brand-500 bg-brand-50/50 ring-4 ring-brand-500/10'
									: 'border-slate-200 hover:bg-slate-50'}"
							>
								<input type="radio" name="type" value={val} bind:group={type} class="sr-only" />
								<span class="flex size-9 shrink-0 items-center justify-center rounded-lg {type === val ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}">
									<Icon class="size-[18px]" />
								</span>
								<span>
									<span class="block text-sm font-semibold">{lbl}</span>
									<span class="block text-xs text-slate-500">{desc}</span>
								</span>
							</label>
						{/each}
					</div>
				</div>

				<div>
					<label class="label" for="url">URL {type === 'reply' ? 'reply' : 'postingan'} <span class="font-normal text-slate-400">· opsional</span></label>
					<div class="relative">
						<Link2 class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
						<input class="input pl-9" id="url" name="url" type="url" placeholder="https://x.com/username/status/…" bind:value={url} />
					</div>
						<DuplicateNotice {dup} />
				</div>

				{#if type === 'reply'}
					<div>
						<label class="label" for="turl">URL postingan yang dibalas <span class="font-normal text-slate-400">· opsional</span></label>
						<div class="relative">
							<CornerDownRight class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
							<input class="input pl-9" id="turl" name="targetUrl" type="url" placeholder="https://…" value={initial.targetUrl ?? ''} />
						</div>
					</div>
				{/if}

				<div class="grid gap-5 md:grid-cols-2">
					<div>
						<label class="label" for="pa">Waktu posting (WIB)</label>
						<div class="relative">
							<CalendarClock class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
							<input class="input pl-9" id="pa" name="postedAt" type="datetime-local" bind:value={postedAt} />
						</div>
						<p class="hint">Default: sekarang. Ubah jika mencatat postingan lama.</p>
					</div>
					<div>
						<label class="label" for="note">Catatan <span class="font-normal text-slate-400">· opsional</span></label>
						<div class="relative">
							<StickyNote class="pointer-events-none absolute top-3 left-3 size-4 text-slate-400" />
							<textarea class="input min-h-[42px] pl-9" id="note" name="note" rows="2" maxlength="1000" placeholder="Topik, kampanye, dll.">{initial.note ?? ''}</textarea>
						</div>
					</div>
				</div>
			</div>
		</section>
	</div>

	<!-- Kolom kanan: screenshot + kirim -->
	<div class="space-y-6 xl:col-span-2">
		<section class="card p-0 xl:sticky xl:top-24">
			<div class="card-header">
				<div class="card-title">3. Screenshot <span class="font-normal text-slate-400">· opsional</span></div>
				{#if preview || shownExisting}
					<button type="button" class="btn btn-soft-danger btn-sm btn-icon" onclick={removeAnyShot} aria-label="Hapus screenshot" title="Hapus screenshot"><Trash2 /></button>
				{/if}
			</div>
			<div class="p-5">
				<div
					role="button"
					tabindex="0"
					ondragover={(e) => {
						e.preventDefault();
						dragging = true;
					}}
					ondragleave={() => (dragging = false)}
					ondrop={onDrop}
					onclick={() => fileInput.click()}
					onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
					class="flex min-h-72 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center transition {dragging
						? 'border-brand-500 bg-brand-50'
						: preview || shownExisting
							? 'border-transparent bg-slate-50'
							: 'border-slate-300 hover:border-brand-400 hover:bg-brand-50/40'}"
				>
					{#if preview}
						<img src={preview} alt="preview" class="max-h-[28rem] w-full object-contain" />
					{:else if shownExisting}
						<img src="/uploads/{initial.screenshotPath}" alt="screenshot saat ini" class="max-h-[28rem] w-full object-contain" />
					{:else}
						<span class="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-8 ring-brand-50/50"><ImageUp class="size-6" /></span>
						<p class="mt-4 text-sm font-medium text-slate-700">Klik untuk memilih atau seret gambar ke sini</p>
						<p class="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500">
							<ClipboardPaste class="size-3.5" /> atau tempel langsung dengan
							<kbd class="rounded border border-slate-300 bg-white px-1 font-sans">Ctrl/⌘ + V</kbd>
						</p>
						<p class="mt-3 text-xs text-slate-400">PNG, JPG, WebP · maks 10 MB</p>
					{/if}
				</div>
				{#if fileName}<p class="hint truncate">{fileName}</p>{:else if shownExisting}<p class="hint">Screenshot saat ini · klik untuk mengganti</p>{/if}
				{#if removeShot}<input type="hidden" name="removeScreenshot" value="1" />{/if}
				<input bind:this={fileInput} type="file" name="screenshot" accept="image/*" class="hidden" onchange={showPreview} />
			</div>
			<div class="space-y-3 border-t border-slate-100 bg-slate-50/50 p-5">
				{#if mode === 'edit'}
					<div>
						<label class="label" for="edit-reason">Alasan perubahan</label>
						<div class="mb-2 flex flex-wrap gap-1.5">
							{#each ['Salah pilih akun', 'URL salah / berubah', 'Ganti screenshot yang lebih jelas', 'Salah tanggal posting', 'Salah tipe (post/reply)'] as preset}
								<button
									type="button"
									onclick={() => (editReason = preset)}
									class="rounded-full px-2.5 py-1 text-xs font-medium transition {editReason === preset
										? 'bg-slate-900 text-white'
										: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'}">{preset}</button
								>
							{/each}
						</div>
						<textarea
							id="edit-reason"
							name="editReason"
							class="input min-h-20"
							maxlength="500"
							placeholder="Jelaskan kenapa rekap ini diubah…"
							bind:value={editReason}
						></textarea>
						<p class="hint flex justify-between gap-3">
							<span>Disimpan di riwayat & terlihat oleh admin.</span>
							<span class={reasonOk ? 'text-emerald-600' : ''}>{reasonOk ? '✓' : 'min. 5 karakter'}</span>
						</p>
					</div>
				{/if}
				<p class="flex items-start gap-2 text-xs {hasEvidence ? 'text-emerald-700' : 'text-slate-500'}">
					{#if hasEvidence}<Check class="mt-px size-3.5 shrink-0" />{:else}<Info class="mt-px size-3.5 shrink-0" />{/if}
					Minimal salah satu wajib diisi: <b>URL</b> atau <b>screenshot</b>.
				</p>
				{#if allowDup}<input type="hidden" name="allowDuplicate" value="1" />{/if}
				{#if serverDup && !allowDup}
					<div class="rounded-xl border border-orange-200 bg-orange-50 p-3.5 text-sm text-orange-900">
						<p class="flex items-center gap-1.5 font-semibold"><Copy class="size-4" /> URL ini sudah pernah direkap</p>
						<p class="mt-1 text-xs text-orange-800">
							{serverDup.mine.length ? `${serverDup.mine.length}× oleh Anda` : ''}{serverDup.mine.length && serverDup.others ? ' · ' : ''}{serverDup.others ? `${serverDup.others}× oleh user lain` : ''}. Simpan tetap jika ini memang rekap yang berbeda.
						</p>
						<button type="button" class="btn btn-soft-warning btn-sm mt-2.5 w-full" onclick={saveAnyway}>Ya, tetap simpan</button>
					</div>
				{/if}
				<button class="btn btn-primary btn-lg w-full" disabled={busy || !hasEvidence || !reasonOk}>
					{#if busy}<LoaderCircle class="animate-spin" /> Menyimpan…{:else if mode === 'edit'}<Save /> Simpan Perubahan{:else}<Send /> Simpan Rekap{/if}
				</button>
			</div>
		</section>
	</div>
</form>
