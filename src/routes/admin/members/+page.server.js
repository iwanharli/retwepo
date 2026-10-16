import { listUsers } from '#lib/server/users.js';
import { userActions } from '#lib/server/admin-actions.js';

// User yang sudah disetujui (termasuk yang sedang ditangguhkan)
export function load({ url }) {
	return listUsers(url, { statuses: ['approved', 'suspended'], defaultStatus: 'approved', defaultSort: { key: 'month', dir: 'desc' } });
}

export const actions = userActions;
