<script>
	import { Trash2, RotateCcw, BadgeCheck, ShieldX, ShieldOff, UserCheck, UserX, Ban, Bell } from '@lucide/svelte';
	let { type, size = 36 } = $props();
	const MAP = {
		recap_deleted: [Trash2, 'bg-rose-50 text-rose-600'],
		recap_restored: [RotateCcw, 'bg-emerald-50 text-emerald-600'],
		account_approved: [BadgeCheck, 'bg-emerald-50 text-emerald-600'],
		account_rejected: [ShieldX, 'bg-rose-50 text-rose-600'],
		account_revoked: [ShieldOff, 'bg-rose-50 text-rose-600'],
		user_approved: [UserCheck, 'bg-emerald-50 text-emerald-600'],
		user_rejected: [UserX, 'bg-rose-50 text-rose-600'],
		user_suspended: [Ban, 'bg-amber-50 text-amber-600'],
		user_reactivated: [RotateCcw, 'bg-emerald-50 text-emerald-600']
	};
	const [Icon, cls] = $derived(MAP[type] ?? [Bell, 'bg-slate-100 text-slate-600']);
</script>

<span class="flex shrink-0 items-center justify-center rounded-full {cls}" style="width:{size}px;height:{size}px"><Icon class="size-[45%]" /></span>
