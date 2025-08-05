import { writable } from 'svelte/store';
import type { mujoco } from 'mujoco_wasm_contrib';

export const mujocoInstance = writable<typeof mujoco | null>(null);
