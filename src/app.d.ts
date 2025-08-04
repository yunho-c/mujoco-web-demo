// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '@mediapipe/tasks-vision' {
	const PoseLandmarker: unknown;
	const FilesetResolver: unknown;
	const DrawingUtils: unknown;
	export { PoseLandmarker, FilesetResolver, DrawingUtils };
}

export {};
