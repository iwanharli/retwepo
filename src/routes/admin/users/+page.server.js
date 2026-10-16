import { listUsers } from '#lib/server/users.js';
import { userActions } from '#lib/server/admin-actions.js';

// Antrian pendaftaran: user yang belum disetujui
export function load({ url }) {
	return listUsers(url, { statuses: ['pending', 'rejected', 'incomplete'], defaultStatus: 'pending', defaultSort: { key: 'registered', dir: 'asc' } });
}

export const actions = userActions;
