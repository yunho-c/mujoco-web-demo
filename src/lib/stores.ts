import { writable } from 'svelte/store';
import type { mujoco as Mujoco } from 'mujoco_wasm_contrib';

export const mujocoInstance = writable<Mujoco | null>(null);
export const scenes = writable<Record<string, string>>({});
export const selectedScene = writable<string | null>(null);
