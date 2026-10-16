import { shellData } from '#lib/server/nav.js';

export function load(event) {
	event.depends('app:pending');
	return shellData(event);
}
