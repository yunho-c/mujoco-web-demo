<script lang="ts">
	import * as THREE from 'three';
	import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { onMount } from 'svelte';
	import type { Model, Simulation, State, mujoco } from '$lib/mujoco/mujoco_wasm';
	import {
		downloadExampleScenesFolder,
		loadSceneFromURL,
		setupGUI
	} from '$lib/mujoco/mujocoUtils.js';
	import { DragStateManager } from '$lib/mujoco/DragStateManager.js';

	let container: HTMLDivElement;
	onMount(() => {
		let demo: MuJoCoDemo | null = null;

		const init = async () => {
			const mujoco = await (window as any).loadMujoco();
			if (!mujoco) {
				return;
			}
			demo = new MuJoCoDemo(mujoco);
			await demo.init();
		};

		init();

		return () => {
			if (demo) {
				demo.renderer.dispose();
				demo.controls.dispose();
				if (demo.gui) {
					demo.gui.destroy();
				}
			}
		};
	});

	class MuJoCoDemo {
		mujoco: mujoco;
		model: Model | null = null;
		state: State | null = null;
		simulation: Simulation | null = null;
		params: any;
		mujoco_time: number;
		bodies: any;
		lights: any;
		tmpVec: THREE.Vector3;
		tmpQuat: THREE.Quaternion;
		updateGUICallbacks: any[];
		container: HTMLDivElement;
		scene: THREE.Scene;
		camera: THREE.PerspectiveCamera;
		ambientLight: THREE.AmbientLight;
		renderer: THREE.WebGLRenderer;
		controls: OrbitControls;
		dragStateManager: DragStateManager;
		gui: GUI | null = null;
		mujocoRoot: THREE.Group | null = null;

		constructor(mujoco: mujoco) {
			this.mujoco = mujoco;
			this.params = {
				scene: 'humanoid.xml',
				paused: false,
				help: false,
				ctrlnoiserate: 0.0,
				ctrlnoisestd: 0.0,
				keyframeNumber: 0
			};
			this.mujoco_time = 0.0;
			this.bodies = {};
			this.lights = {};
			this.tmpVec = new THREE.Vector3();
			this.tmpQuat = new THREE.Quaternion();
			this.updateGUICallbacks = [];
			this.container = container;
			this.scene = new THREE.Scene();
			this.scene.name = 'scene';
			this.camera = new THREE.PerspectiveCamera(
				45,
				window.innerWidth / window.innerHeight,
				0.001,
				100
			);
			this.camera.name = 'PerspectiveCamera';
			this.camera.position.set(2.0, 1.7, 1.7);
			this.scene.add(this.camera);
			this.scene.background = new THREE.Color(0.15, 0.25, 0.35);
			this.scene.fog = new THREE.Fog(this.scene.background, 15, 25.5);
			this.ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
			this.ambientLight.name = 'AmbientLight';
			this.scene.add(this.ambientLight);
			this.renderer = new THREE.WebGLRenderer({ antialias: true });
			this.renderer.setPixelRatio(window.devicePixelRatio);
			this.renderer.setSize(window.innerWidth, window.innerHeight);
			this.renderer.shadowMap.enabled = true;
			this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
			this.renderer.setAnimationLoop(this.render.bind(this));
			this.container.appendChild(this.renderer.domElement);
			this.controls = new OrbitControls(this.camera, this.renderer.domElement);
			this.controls.target.set(0, 0.7, 0);
			this.controls.panSpeed = 2;
			this.controls.zoomSpeed = 1;
			this.controls.enableDamping = true;
			this.controls.dampingFactor = 0.1;
			this.controls.screenSpacePanning = true;
			this.controls.update();
			window.addEventListener('resize', this.onWindowResize.bind(this));
			this.dragStateManager = new DragStateManager(
				this.scene,
				this.renderer,
				this.camera,
				this.container.parentElement as HTMLElement,
				this.controls
			);
		}

		async init() {
			await downloadExampleScenesFolder(this.mujoco);
			[this.model, this.state, this.simulation, this.bodies, this.lights] = await loadSceneFromURL(
				this.mujoco,
				this.params.scene,
				this
			);
			this.gui = new GUI();
			setupGUI(this);
		}

		onWindowResize() {
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(window.innerWidth, window.innerHeight);
		}

		render() {
			this.controls.update();
			if (!this.params['paused'] && this.model && this.simulation) {
				const timestep = this.model.getOptions().timestep;
				if (Date.now() - this.mujoco_time > 35.0) {
					this.mujoco_time = Date.now();
				}
				while (this.mujoco_time < Date.now()) {
					this.simulation.step();
					this.mujoco_time += timestep * 1000.0;
				}
			}
			if (this.model && this.simulation) {
				for (let b = 0; b < this.model.nbody; b++) {
					if (this.bodies[b]) {
						this.bodies[b].position.fromArray(this.simulation.xpos, b * 3);
						this.bodies[b].quaternion.fromArray(this.simulation.xquat, b * 4);
					}
				}
			}
			this.renderer.render(this.scene, this.camera);
		}
	}
</script>

<div bind:this={container} class="w-full h-full" />
