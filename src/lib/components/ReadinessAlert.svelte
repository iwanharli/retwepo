<script>
	import { TriangleAlert, UserRoundPen, Link2, Clock, CircleCheck, ArrowRight } from '@lucide/svelte';

	/**
	 * Peringatan di beranda bila user belum bisa membuat rekap.
	 * missingProfile: label data profil yang kosong; accounts: daftar akun sosmed user (dengan status)
	 */
	let { missingProfile = [], accounts = [] } = $props();

	const approved = $derived(accounts.filter((a) => a.status === 'approved').length);
	const pending = $derived(accounts.filter((a) => a.status === 'pending').length);
	const profileOk = $derived(missingProfile.length === 0);
	const accountOk = $derived(approved > 0);
</script>

{#if !profileOk || !accountOk}
	<section class="mb-6 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-card lg:mb-8">
		<div class="flex items-start gap-4 p-5">
			<span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 ring-1 ring-amber-200">
				<TriangleAlert class="size-5" />
			</span>
			<div class="min-w-0 flex-1">
				<h2 class="font-semibold text-amber-900">Anda belum bisa membuat rekap</h2>
				<p class="mt-0.5 text-sm text-amber-800/80">Selesaikan langkah berikut agar fitur rekap aktif.</p>

				<ul class="mt-4 grid gap-3 md:grid-cols-2">
					<!-- Profil -->
					<li class="flex items-center gap-3 rounded-xl border bg-white/70 p-3.5 {profileOk ? 'border-emerald-200' : 'border-amber-200'}">
						<span class="flex size-9 shrink-0 items-center justify-center rounded-lg {profileOk ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}">
							{#if profileOk}<CircleCheck class="size-[18px]" />{:else}<UserRoundPen class="size-[18px]" />{/if}
						</span>
						<div class="min-w-0 flex-1">
							<div class="text-sm font-medium text-slate-900">Data profil</div>
							<div class="truncate text-xs {profileOk ? 'text-emerald-700' : 'text-amber-700'}">
								{profileOk ? 'Sudah lengkap' : `Belum diisi: ${missingProfile.join(', ')}`}
							</div>
						</div>
						{#if !profileOk}<a href="/app/profile" class="btn btn-sm btn-primary shrink-0">Lengkapi <ArrowRight /></a>{/if}
					</li>

					<!-- Akun sosmed -->
					<li class="flex items-center gap-3 rounded-xl border bg-white/70 p-3.5 {accountOk ? 'border-emerald-200' : 'border-amber-200'}">
						<span class="flex size-9 shrink-0 items-center justify-center rounded-lg {accountOk ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}">
							{#if accountOk}<CircleCheck class="size-[18px]" />{:else if pending}<Clock class="size-[18px]" />{:else}<Link2 class="size-[18px]" />{/if}
						</span>
						<div class="min-w-0 flex-1">
							<div class="text-sm font-medium text-slate-900">Akun sosmed terverifikasi</div>
							<div class="truncate text-xs {accountOk ? 'text-emerald-700' : 'text-amber-700'}">
								{#if accountOk}
									{approved} akun disetujui
								{:else if pending}
									{pending} akun menunggu verifikasi admin
								{:else}
									Belum ada akun yang disetujui
								{/if}
							</div>
						</div>
						{#if !accountOk}
							<a href="/app/accounts" class="btn btn-sm btn-secondary shrink-0">{pending ? 'Lihat status' : 'Tambah akun'} <ArrowRight /></a>
						{/if}
					</li>
				</ul>
			</div>
		</div>
	</section>
{/if}
