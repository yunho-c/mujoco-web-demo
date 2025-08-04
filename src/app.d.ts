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
	interface Window {
		load_mujoco: (options: { mainScriptUrlOrBlob: string }) => Promise<any>;
		downloadExampleScenesFolder: (mujoco: any) => Promise<void>;
		loadSceneFromURL: (
			mujoco: any,
			scene: string,
			demo: any
		) => Promise<[any, any, any, any, any]>;
		setupGUI: (demo: any) => void;
		DragStateManager: new (
			scene: any,
			renderer: any,
			camera: any,
			container: HTMLElement,
			controls: any
		) => any;
	}
}

declare module '@mediapipe/tasks-vision' {
	const PoseLandmarker: unknown;
	const FilesetResolver: unknown;
	const DrawingUtils: unknown;
	export { PoseLandmarker, FilesetResolver, DrawingUtils };
}

export {};
