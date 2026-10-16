<script>
	import { AlertDialog } from 'bits-ui';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { LoaderCircle, CircleAlert, X } from '@lucide/svelte';

	/**
	 * Modal konfirmasi aksi (dengan alasan opsional) yang mengirim form action.
	 *
	 * action        nama form action, mis. "rejectUser" (query string halaman ikut dipertahankan)
	 * fields        input tersembunyi; nilai array = input berulang (mis. id terpilih)
	 * tone          danger | warning | success | brand — warna ikon & tombol
	 * note          { label, placeholder, presets: string[], required, hint } → tampilkan kotak alasan (wajib = min. 5 karakter)
	 * confirmText   teks yang harus diketik ulang sebelum tombol aktif (mis. email user)
	 * children      ringkasan objek yang ditindak (snippet)
	 * trigger       isi tombol pembuka (snippet); triggerClass / triggerDisabled
	 * onSuccess     callback setelah berhasil; jika diisi, halaman tidak dimuat ulang
	 */
	let {
		action,
		fields = {},
		title,
		description = '',
		tone = 'danger',
		icon: Icon = null,
		confirmLabel = 'Konfirmasi',
		note = null,
		children = null,
		trigger,
		triggerClass = 'btn btn-secondary btn-sm',
		triggerDisabled = false,
		triggerLabel = undefined,
		confirmText = null,
		confirmName = 'confirm',
		onSuccess = null
	} = $props();

	let open = $state(false);
	let busy = $state(false);
	let error = $state('');
	let noteText = $state('');
	let typed = $state('');
	const MIN_NOTE = 5;
	const noteOk = $derived(!note?.required || noteText.trim().length >= MIN_NOTE);
	const typedOk = $derived(!confirmText || typed.trim().toLowerCase() === confirmText.toLowerCase());

	const TONES = {
		danger: { icon: 'bg-rose-100 text-rose-600 ring-rose-50', btn: 'btn-danger' },
		warning: { icon: 'bg-amber-100 text-amber-600 ring-amber-50', btn: 'bg-amber-500 text-white shadow-sm hover:bg-amber-600' },
		success: { icon: 'bg-emerald-100 text-emerald-600 ring-emerald-50', btn: 'btn-success' },
		brand: { icon: 'bg-brand-100 text-brand-600 ring-brand-50', btn: 'btn-primary' }
	};
	const t = $derived(TONES[tone] ?? TONES.danger);

	// pertahankan query string (filter/pencarian) saat memanggil form action
	const actionUrl = $derived.by(() => {
		const q = new URLSearchParams(page.url.search);
		const rest = [...q].length ? `${q}&` : '';
		return `?${rest}/${action}`;
	});

	function onOpenChange(v) {
		if (v) {
			noteText = '';
			typed = '';
			error = '';
		}
	}

	const submit = () => {
		busy = true;
		error = '';
		return async ({ result, update }) => {
			busy = false;
			if (result.type === 'failure') {
				error = result.data?.error ?? 'Aksi gagal, coba lagi.';
				return;
			}
			if (result.type === 'error') {
				error = result.error?.message ?? 'Terjadi kesalahan.';
				return;
			}
			open = false;
			if (onSuccess && result.type === 'success') onSuccess(result);
			else await update();
			invalidate('app:pending');
		};
	};
</script>

<AlertDialog.Root bind:open {onOpenChange}>
	<AlertDialog.Trigger class={triggerClass} disabled={triggerDisabled} aria-label={triggerLabel} title={triggerLabel}>{@render trigger()}</AlertDialog.Trigger>
	<AlertDialog.Portal>
		<AlertDialog.Overlay class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" />
		<AlertDialog.Content
			class="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
		>
			<form method="POST" action={actionUrl} use:enhance={submit}>
				{#each Object.entries(fields) as [k, v]}
					{#each Array.isArray(v) ? v : [v] as val}<input type="hidden" name={k} value={val} />{/each}
				{/each}

				<div class="flex gap-4 p-6 pb-5">
					{#if Icon}
						<span class="flex size-11 shrink-0 items-center justify-center rounded-full ring-8 {t.icon}"><Icon class="size-5" /></span>
					{/if}
					<div class="min-w-0 flex-1 pt-0.5">
						<AlertDialog.Title class="text-base font-semibold text-slate-900">{title}</AlertDialog.Title>
						{#if description}<AlertDialog.Description class="mt-1 text-sm text-slate-500">{description}</AlertDialog.Description>{/if}
					</div>
					<AlertDialog.Cancel class="btn btn-ghost btn-icon -mt-1 -mr-2 size-8" aria-label="Tutup"><X /></AlertDialog.Cancel>
				</div>

				{#if children}
					<div class="mx-6 mb-5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">{@render children()}</div>
				{/if}

				{#if note}
					<div class="mx-6 mb-5">
						<label class="label" for="action-note">
							{note.label ?? 'Alasan'}
							{#if !note.required}<span class="font-normal text-slate-400">· opsional</span>{/if}
						</label>
						{#if note.presets?.length}
							<div class="mb-2 flex flex-wrap gap-1.5">
								{#each note.presets as p}
									<button
										type="button"
										onclick={() => (noteText = p)}
										class="rounded-full px-2.5 py-1 text-xs font-medium transition {noteText === p
											? 'bg-slate-900 text-white'
											: 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">{p}</button
									>
								{/each}
							</div>
						{/if}
						<textarea
							id="action-note"
							name="note"
							class="input min-h-24 resize-y"
							maxlength="500"
							placeholder={note.placeholder ?? 'Tulis alasan…'}
							required={note.required}
							bind:value={noteText}
						></textarea>
						<div class="hint flex justify-between gap-3">
							<span>{note.hint ?? ''}</span>
							{#if note.required}<span class={noteOk ? 'text-emerald-600' : ''}>{noteOk ? '✓' : `min. ${MIN_NOTE} karakter`}</span>{/if}
						</div>
					</div>
				{/if}

				{#if confirmText}
					<div class="mx-6 mb-5">
						<label class="label" for="action-confirm">Ketik <code class="rounded bg-slate-100 px-1.5 py-0.5 text-slate-900">{confirmText}</code> untuk konfirmasi</label>
						<input id="action-confirm" name={confirmName} class="input" autocomplete="off" spellcheck="false" bind:value={typed} placeholder={confirmText} />
					</div>
				{/if}

				{#if error}
					<div class="mx-6 mb-5 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
						<CircleAlert class="mt-0.5 size-4 shrink-0" />{error}
					</div>
				{/if}

				<div class="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
					<AlertDialog.Cancel type="button" class="btn btn-secondary">Batal</AlertDialog.Cancel>
					<button class="btn {t.btn}" disabled={busy || !noteOk || !typedOk}>
						{#if busy}<LoaderCircle class="animate-spin" /> Memproses…{:else}{confirmLabel}{/if}
					</button>
				</div>
			</form>
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>
