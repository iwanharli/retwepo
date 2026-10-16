<script>
	import { SquarePlus, Link2Off, UserRoundPen } from '@lucide/svelte';
	import Flash from '#lib/components/Flash.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import RecapForm from '#lib/components/RecapForm.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Tambah Rekap · Retwepo</title></svelte:head>

<PageHeader title="Tambah Rekap" description="Catat postingan atau reply yang sudah Anda buat di media sosial." icon={SquarePlus} />

{#if data.missingProfile.length}
	<EmptyState
		icon={UserRoundPen}
		title="Lengkapi profil terlebih dahulu"
		description="Sebelum membuat rekap, isi data berikut di halaman profil: {data.missingProfile.join(', ')}."
	>
		<a href="/app/profile" class="btn btn-primary"><UserRoundPen /> Lengkapi profil</a>
	</EmptyState>
{:else if !data.accounts.length}
	<EmptyState icon={Link2Off} title="Belum ada akun yang disetujui" description="Rekap hanya bisa dibuat untuk akun media sosial yang sudah diverifikasi admin.">
		<a href="/app/accounts" class="btn btn-primary">Lihat status akun</a>
	</EmptyState>
{:else}
	<Flash {form} />
	<RecapForm accounts={data.accounts} {form} initial={{ accountId: data.preselect }} />
{/if}
