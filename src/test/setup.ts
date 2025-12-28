import '@vitejs/plugin-react-swc/preamble'
import '@testing-library/jest-dom/vitest'

// jsdom may not implement matchMedia (or may provide a stub that's not callable).
if (typeof window.matchMedia !== 'function') {
	// @ts-expect-error - test shim
	window.matchMedia = (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener: () => {},
		removeEventListener: () => {},
		addListener: () => {},
		removeListener: () => {},
		dispatchEvent: () => false,
	})
}
