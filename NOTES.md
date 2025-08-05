```
╭─────────────────────────────────────────────────────╮
│  > Could you explain the structure with the store?  │
╰─────────────────────────────────────────────────────╯

✦ Of course. Here is a breakdown of the new structure using a Svelte store:

   1. `src/lib/stores.ts` (New File)
       * This file defines a writable Svelte store named mujocoInstance.
       * A store is a reactive, global container for a value. Any part of the application can "subscribe" to it and will be notified whenever the value
         changes.
       * Its purpose is to hold the main mujoco object after it has been asynchronously loaded.

   2. `src/lib/components/MujocoSimulation.svelte` (The "Producer")
       * This component is responsible for loading the MuJoCo WebAssembly module via load_mujoco().
       * Once the mujoco object is successfully loaded, it calls mujocoInstance.set(mujoco).
       * This action places the mujoco object into the store, making it available to any other component that is listening.

   3. `src/routes/+layout.svelte` (The "Consumer")
       * This component needs access to the mujoco object to pass it to the downloadExampleScenes function.
       * It imports mujocoInstance and uses mujocoInstance.subscribe(...) to listen for changes.
       * When the MujocoSimulation component puts the mujoco object into the store, the subscription in the layout fires, and its local mujoco variable
         gets updated from null to the actual mujoco object.
       * The "Download Example Scenes" button is disabled until this mujoco variable is no longer null, ensuring it can only be clicked after the
         instance is ready.

  In short, this pattern decouples the components. The layout doesn't need to load the MuJoCo instance itself; it simply listens to the store and
  waits for another component to provide it. This makes the state management cleaner and more scalable.
```

---
---

**User:**

> Could you explain the role of `index.json` when loading mujoco scenes?

**Assistant:**

Based on the code in [`src/lib/services/mujocoAssetLoader.ts`](src/lib/services/mujocoAssetLoader.ts:1), the `index.json` file acts as a **manifest** or an **index** that maps a main MuJoCo scene file (e.g., `humanoid.xml`) to a complete list of all its required asset files (like meshes, textures, and other included XML files).

Here's a breakdown of its role and how it contrasts with the older loading method:

### The Role of `index.json` in `mujocoAssetLoader.ts`

The [`loadSceneWithAssets`](src/lib/services/mujocoAssetLoader.ts:42) function is designed to load a specific MuJoCo scene and only the assets that it depends on.

1.  **Fetch the Index**: It first fetches [`/examples/scenes/index.json`](static/examples/scenes/index.json). This file contains a JSON object where keys are the main scene filenames (e.g., `"humanoid.xml"`) and the values are arrays of strings listing all the files that scene requires.

    ```typescript
    // src/lib/services/mujocoAssetLoader.ts:52-56
    const indexResp = await fetch('/examples/scenes/index.json');
    if (!indexResp.ok) {
        throw new Error('Failed to fetch /examples/scenes/index.json');
    }
    const sceneIndex = await indexResp.json();
    ```

2.  **Find the Scene's Files**: It uses the `sceneFilePath` argument to look up the corresponding entry in the `sceneIndex`. For example, if you want to load `"humanoid.xml"`, it finds the `"humanoid.xml"` key in the JSON data.

    ```typescript
    // src/lib/services/mujocoAssetLoader.ts:58-63
    const sceneKey = sceneFilePath.replace(/^examples\/scenes\//, '');
    const fileList = sceneIndex[sceneKey];

    if (!fileList) {
        throw new Error(`Scene key '${sceneKey}' not found in /examples/scenes/index.json. Make sure to run generate_index.py.`);
    }
    ```

3.  **Load Only Necessary Assets**: It then iterates through the `fileList` for that specific scene and fetches each required file, loading it into the MuJoCo virtual filesystem.

This approach is efficient because it only downloads the assets needed for the selected scene, rather than all possible assets for every scene.

### The Old Method in `mujoco-utils.js`

In contrast, the [`downloadExampleScenes`](src/lib/mujoco/mujoco-utils.js:328) function in [`src/lib/mujoco/mujoco-utils.js`](src/lib/mujoco/mujoco-utils.js:1) uses a hardcoded list of *all* possible files for *all* example scenes.

```javascript
// src/lib/mujoco/mujoco-utils.js:329-379
export async function downloadExampleScenes(mujoco) {
  let allFiles = [
    '22_humanoids.xml',
    'adhesion.xml',
    'agility_cassie/assets/achilles-rod.obj',
        // ... and so on for all files
    ];
    // ... logic to fetch every file in this list
}
```

This older method is inefficient and less scalable. Every time a new scene or asset is added, the `allFiles` array must be manually updated. It also forces the browser to download every single asset, even if the user only wants to view a simple scene that has no dependencies.

### Summary

In short, `index.json` provides a structured and efficient way to manage scene assets. It decouples the asset loading logic from a hardcoded list, allowing the application to dynamically and selectively load only the necessary files for a given MuJoCo scene. This improves performance, reduces unnecessary downloads, and makes the system easier to maintain and scale.

