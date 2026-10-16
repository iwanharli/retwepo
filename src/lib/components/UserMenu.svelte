<script>
	import { DropdownMenu } from 'bits-ui';
	import { ChevronDown, UserRound, LogOut } from '@lucide/svelte';
	import Avatar from './Avatar.svelte';
	let { user } = $props();
	let logoutForm;

	const itemCls =
		'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-slate-700 outline-none data-highlighted:bg-slate-100 data-highlighted:text-slate-900 [&_svg]:size-4 [&_svg]:text-slate-400';
</script>

<form method="POST" action="/logout" bind:this={logoutForm} class="hidden"></form>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class="flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand-500/40">
		<Avatar {user} size={32} />
		<span class="hidden text-left leading-tight sm:block">
			<span class="block text-sm font-medium text-slate-900">{user.nickname ?? user.email}</span>
			<span class="block text-xs text-slate-500">{user.role === 'admin' ? 'Administrator' : 'Member'}</span>
		</span>
		<ChevronDown class="size-4 text-slate-400" />
	</DropdownMenu.Trigger>
	<DropdownMenu.Portal>
		<DropdownMenu.Content
			align="end"
			sideOffset={8}
			class="z-50 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg data-[state=open]:animate-in"
		>
			<div class="px-2.5 py-2">
				<div class="truncate text-sm font-medium">{user.nickname}</div>
				<div class="truncate text-xs text-slate-500">{user.email}</div>
			</div>
			<DropdownMenu.Separator class="my-1 h-px bg-slate-100" />
			<DropdownMenu.Item class={itemCls} onSelect={() => (location.href = '/app/profile')}>
				<UserRound /> Profil saya
			</DropdownMenu.Item>
			<DropdownMenu.Separator class="my-1 h-px bg-slate-100" />
			<DropdownMenu.Item class="{itemCls} text-rose-600 data-highlighted:bg-rose-50 data-highlighted:text-rose-700 [&_svg]:text-rose-500" onSelect={() => logoutForm.requestSubmit()}>
				<LogOut /> Keluar
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>
