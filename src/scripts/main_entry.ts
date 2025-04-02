// main_entry.ts
import { initUI } from './ui.js';
import { initScanner } from './scanner.js';
import { initGuests } from './guests.js';

document.addEventListener('DOMContentLoaded', () => {
	if (window.lucide) {
		window.lucide.createIcons();
	}

	// arrow keys, dropdown animations
	initUI();
	// scanning logic
	initScanner();
	// visitors logic
	initGuests();
});
