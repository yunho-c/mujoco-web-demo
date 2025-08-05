import { scenes } from '$lib/stores';

interface EmscriptenFS {
	lookupPath(path: string, opts: object): unknown;
	mkdir(path: string): unknown;
	writeFile(path: string, data: Uint8Array): void;
}

interface MujocoInstance {
	FS: EmscriptenFS;
}

/**
 * Creates a directory tree in the Emscripten virtual file system.
 * @param FS The Emscripten FS object from the MuJoCo instance.
 * @param path The path of the directory to create.
 */
function mkdirTree(FS: EmscriptenFS, path: string) {
	const parts = path.split('/').filter((p) => p.length > 0);
	let current = '';
	for (const part of parts) {
		current = current + '/' + part;
		if (current === '') continue;
		try {
			// Check if path exists. Throws if it doesn't.
			FS.lookupPath(current, {});
		} catch {
			FS.mkdir(current);
		}
	}
}

/**
 * Loads a scene and its assets into the MuJoCo virtual file system. It uses an `index.json` file
 * located in the same directory as the scene's XML file to determine which asset files to load. The
 * file paths in the index are relative to the scene's directory. The files are loaded into the
 * `/working/` directory in the virtual FS, preserving the directory structure from the index.
 *
 * @param mujoco - The MuJoCo instance (Emscripten module).
 * @param sceneFilePath - The path to the main scene XML file, relative to the `/static` directory.
 *   Example: 'models/rby1a/mujoco/rby1a.xml'.
 */
export async function loadSceneWithAssets(
	mujoco: MujocoInstance,
	sceneFilePath: string
): Promise<void> {
	// Get the directory of the scene file, relative to /static.
	const lastSlashIdx = sceneFilePath.lastIndexOf('/');
	const sceneDir = lastSlashIdx === -1 ? '' : sceneFilePath.substring(0, lastSlashIdx);

	// The index.json is expected to be a sibling of the scene's root XML file.
	const indexPath = sceneDir ? `${sceneDir}/index.json` : 'index.json';
	const indexResp = await fetch(`/${indexPath}`);
	if (!indexResp.ok) {
		throw new Error(`Failed to fetch asset index file: /${indexPath}`);
	}
	const fileList = (await indexResp.json()) as string[];

	if (!Array.isArray(fileList)) {
		throw new Error(`Asset index file is not a JSON array: /${indexPath}`);
	}

	await Promise.all(
		fileList.map(async (file) => {
			// `file` is a path relative to `sceneDir`, e.g., 'my_scene.xml' or 'assets/texture.png'
			const pathInStatic = sceneDir ? `${sceneDir}/${file}` : file;
			const fileResp = await fetch(`/${pathInStatic}`);
			if (!fileResp.ok) {
				console.error(`Failed to fetch asset: /${pathInStatic}`);
				return; // Continue with other files
			}
			const fileData = await fileResp.arrayBuffer();

			// The destination path in the virtual file system.
			// We want to preserve the relative structure within the /working directory.
			const destPath = `/working/${file}`;
			const dirInWorking = destPath.substring(0, destPath.lastIndexOf('/'));

			mkdirTree(mujoco.FS, dirInWorking);

			mujoco.FS.writeFile(destPath, new Uint8Array(fileData));
			console.log(`Loaded ${pathInStatic} into ${destPath}`);
		})
	);

	const sceneName = sceneFilePath.split('/').pop()?.replace('.xml', '');
	if (sceneName) {
		scenes.update((s) => ({ ...s, [sceneName]: sceneFilePath }));
	}
}
