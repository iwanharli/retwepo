<script>
	import { page } from '$app/state';
	import { UserRound, X } from '@lucide/svelte';
	import { PLATFORMS, PLATFORM_KEYS } from '#lib/constants.js';
	import FilterBar from './FilterBar.svelte';
	import FilterSelect from './FilterSelect.svelte';
	import PlatformIcon from './PlatformIcon.svelte';

	/**
	 * Filter halaman rekap (Riwayat Rekap user & Semua Rekap admin).
	 * accounts: daftar akun milik user (halaman user) → dropdown akun; tanpa ini → dropdown platform
	 * filterUser / filterAccount: filter dari halaman lain (?user= / ?account=), tampil sebagai chip
	 */
	let { f, campaigns = [], accounts = null, filterUser = null, filterAccount = null, placeholder = 'Cari URL, catatan, username…' } = $props();

	function without(key) {
		const u = new URLSearchParams(page.url.search);
		u.delete(key);
		u.delete('page');
		return '?' + u;
	}
	const chipCls = 'inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-50 pr-2 text-xs font-medium text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100';
</script>

<FilterBar
	dates={{ from: f.from, to: f.to, allowAll: true }}
	search={{ value: f.q, placeholder }}
	managed={[accounts ? 'account' : 'platform', 'campaign', 'type', 'evidence']}
	chips={filterUser || filterAccount ? chips : null}
>
	{#if accounts}
		<FilterSelect name="account" value={f.account ?? ''} all="Semua akun" options={accounts.map((a) => [a.id, `${PLATFORMS[a.platform].label} · @${a.username}`])} />
	{:else}
		<FilterSelect name="platform" multiple value={f.platforms} all="Semua platform" options={PLATFORM_KEYS.map((k) => [k, PLATFORMS[k].label])} />
	{/if}
	<FilterSelect name="campaign" value={f.campaign ?? ''} all="Semua kampanye" options={campaigns.map((c) => [c.id, `#${c.name}`])} />
	<FilterSelect name="type" value={f.type ?? ''} all="Semua tipe" options={[['post', 'Postingan'], ['reply', 'Panel']]} />
	<FilterSelect name="evidence" value={f.evidence ?? ''} all="Semua bukti" options={[['url', 'Ada URL'], ['shot', 'Ada screenshot'], ['dup', 'URL duplikat']]} />
</FilterBar>

{#snippet chips()}
	{#if filterUser}
		<a href={without('user')} class="{chipCls} pl-2.5" title="Hapus filter user"><UserRound class="size-3.5" />{filterUser.nickname ?? filterUser.email}<X class="size-3.5 opacity-60" /></a>
	{/if}
	{#if filterAccount}
		<a href={without('account')} class="{chipCls} pl-1.5" title="Hapus filter akun"
			><PlatformIcon platform={filterAccount.platform} size={18} class="rounded-full" />@{filterAccount.username}<X class="size-3.5 opacity-60" /></a
		>
	{/if}
{/snippet}
