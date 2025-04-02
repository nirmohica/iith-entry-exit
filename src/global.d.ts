// global.d.ts
declare global {
	interface Window {
		lucide?: {
			createIcons: () => void;
			// If you need other functions from lucide, list them here
		};
	}
}

// Make sure TypeScript treats this as a module
export { };
