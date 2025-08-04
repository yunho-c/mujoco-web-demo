<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as THREE from 'three';
	import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { DragStateManager } from '$lib/mujoco/DragStateManager.js';
	import { setupGUI, downloadExampleScenesFolder, loadSceneFromURL, getPosition, getQuaternion, toMujocoPos, standardNormal } from '$lib/mujoco/mujocoUtils.js';
	import type { mujoco as MuJoCo, Model, State, Simulation } from '$lib/mujoco/mujoco_wasm.d.ts';
	import load_mujoco from '$lib/mujoco/mujoco_wasm.js';

	interface MuJoCoBody extends THREE.Object3D {
		bodyID?: number;
	}

	let container: HTMLDivElement;
	let renderer: THREE.WebGLRenderer;
	let camera: THREE.PerspectiveCamera;
	let scene: THREE.Scene;
	let controls: OrbitControls;
	let mujoco: MuJoCo;
	let model: Model;
	let state: State;
	let simulation: Simulation;
	let bodies: { [key: number]: MuJoCoBody } = {};
	let lights: { [key: number]: THREE.Light } = {};
	let tmpVec = new THREE.Vector3();
	let tmpQuat = new THREE.Quaternion();
	let params: { [key: string]: any } = { scene: "humanoid.xml", paused: false, help: false, ctrlnoiserate: 0.0, ctrlnoisestd: 0.0, keyframeNumber: 0 };
	let mujoco_time = 0.0;
	let dragStateManager: DragStateManager;
	let gui: GUI;
	let updateGUICallbacks: any[] = [];
	let mujocoRoot: THREE.Group & { cylinders?: THREE.InstancedMesh, spheres?: THREE.InstancedMesh };

	onMount(async () => {
		mujoco = await load_mujoco({
			locateFile: (file: string) => file,
		});
		const initialScene = "humanoid.xml";
		mujoco.FS.mkdir('/working');
		mujoco.FS.mount(mujoco.MEMFS, { root: '.' }, '/working');
		const sceneResponse = await fetch(`/mujoco/scenes/${initialScene}`);
		const sceneText = await sceneResponse.text();
		mujoco.FS.writeFile(`/working/${initialScene}`, sceneText);

		model = new mujoco.Model(`/working/${initialScene}`);
		state = new mujoco.State(model);
		simulation = new mujoco.Simulation(model, state);

		scene = new THREE.Scene();
		scene.name = 'scene';

		camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.001, 100);
		camera.name = 'PerspectiveCamera';
		camera.position.set(2.0, 1.7, 1.7);
		scene.add(camera);

		scene.background = new THREE.Color(0.15, 0.25, 0.35);
		scene.fog = new THREE.Fog(scene.background, 15, 25.5);

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
		ambientLight.name = 'AmbientLight';
		scene.add(ambientLight);

		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		container.appendChild(renderer.domElement);

		controls = new OrbitControls(camera, renderer.domElement);
		controls.target.set(0, 0.7, 0);
		controls.panSpeed = 2;
		controls.zoomSpeed = 1;
		controls.enableDamping = true;
		controls.dampingFactor = 0.10;
		controls.screenSpacePanning = true;
		controls.update();

		dragStateManager = new DragStateManager(scene, renderer, camera, container, controls);

		await downloadExampleScenesFolder(mujoco);
		[model, state, simulation, bodies, lights, mujocoRoot] = await loadSceneFromURL(mujoco, initialScene, { scene, bodies, lights, updateGUICallbacks });

		gui = new GUI();
		setupGUI({ gui, params, model, state, simulation, updateGUICallbacks });

		const resizeObserver = new ResizeObserver(() => {
			camera.aspect = container.clientWidth / container.clientHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(container.clientWidth, container.clientHeight);
		});
		resizeObserver.observe(container);

		renderer.setAnimationLoop(render);

	});

	onDestroy(() => {
		if (renderer) {
			renderer.dispose();
		}
		if (gui) {
			gui.destroy();
		}
	});

	function render(timeMS: number) {
		controls.update();

		if (!params["paused"]) {
			let timestep = model.getOptions().timestep;
			if (timeMS - mujoco_time > 35.0) { mujoco_time = timeMS; }
			while (mujoco_time < timeMS) {
				if (params["ctrlnoisestd"] > 0.0) {
					let rate = Math.exp(-timestep / Math.max(1e-10, params["ctrlnoiserate"]));
					let scale = params["ctrlnoisestd"] * Math.sqrt(1 - rate * rate);
					let currentCtrl = simulation.ctrl;
					for (let i = 0; i < currentCtrl.length; i++) {
						currentCtrl[i] = rate * currentCtrl[i] + scale * standardNormal();
						params["Actuator " + i] = currentCtrl[i];
					}
				}

				for (let i = 0; i < simulation.qfrc_applied.length; i++) { simulation.qfrc_applied[i] = 0.0; }
				let dragged: MuJoCoBody | null = dragStateManager.physicsObject;
				if (dragged && dragged.bodyID !== undefined) {
					for (let b = 0; b < model.nbody; b++) {
						if (bodies[b]) {
							getPosition(simulation.xpos, b, bodies[b].position);
							getQuaternion(simulation.xquat, b, bodies[b].quaternion);
							bodies[b].updateWorldMatrix();
						}
					}
					let bodyID = dragged.bodyID;
					dragStateManager.update();
					let force = toMujocoPos(dragStateManager.currentWorld.clone().sub(dragStateManager.worldHit).multiplyScalar(model.body_mass[bodyID] * 250));
					let point = toMujocoPos(dragStateManager.worldHit.clone());
					simulation.applyForce(force.x, force.y, force.z, 0, 0, 0, point.x, point.y, point.z, bodyID);
				}

				simulation.step();
				mujoco_time += timestep * 1000.0;
			}
		} else if (params["paused"]) {
			dragStateManager.update();
			let dragged: MuJoCoBody | null = dragStateManager.physicsObject;
			if (dragged && dragged.bodyID !== undefined) {
				let b = dragged.bodyID;
				getPosition(simulation.xpos, b, tmpVec, false);
				getQuaternion(simulation.xquat, b, tmpQuat, false);

				let offset = toMujocoPos(dragStateManager.currentWorld.clone().sub(dragStateManager.worldHit).multiplyScalar(0.3));
				if (model.body_mocapid[b] >= 0) {
					let addr = model.body_mocapid[b] * 3;
					let pos = simulation.mocap_pos;
					pos[addr + 0] += offset.x;
					pos[addr + 1] += offset.y;
					pos[addr + 2] += offset.z;
				} else {
					let root = model.body_rootid[b];
					let addr = model.jnt_qposadr[model.body_jntadr[root]];
					let pos = simulation.qpos;
					pos[addr + 0] += offset.x;
					pos[addr + 1] += offset.y;
					pos[addr + 2] += offset.z;
				}
			}
			simulation.forward();
		}

		for (let b = 0; b < model.nbody; b++) {
			if (bodies[b]) {
				getPosition(simulation.xpos, b, bodies[b].position);
				getQuaternion(simulation.xquat, b, bodies[b].quaternion);
				bodies[b].updateWorldMatrix();
			}
		}

		for (let l = 0; l < model.nlight; l++) {
			if (lights[l]) {
				getPosition(simulation.light_xpos, l, lights[l].position);
				getPosition(simulation.light_xdir, l, tmpVec);
				lights[l].lookAt(tmpVec.add(lights[l].position));
			}
		}

		let numWraps = 0;
		if (mujocoRoot && mujocoRoot.cylinders) {
			let mat = new THREE.Matrix4();
			for (let t = 0; t < model.ntendon; t++) {
				let startW = simulation.ten_wrapadr[t];
				let r = model.tendon_width[t];
				for (let w = startW; w < startW + simulation.ten_wrapnum[t] - 1; w++) {
					let tendonStart = getPosition(simulation.wrap_xpos, w, new THREE.Vector3());
					let tendonEnd = getPosition(simulation.wrap_xpos, w + 1, new THREE.Vector3());
					let tendonAvg = new THREE.Vector3().addVectors(tendonStart, tendonEnd).multiplyScalar(0.5);

					let validStart = tendonStart.length() > 0.01;
					let validEnd = tendonEnd.length() > 0.01;

					if (validStart && mujocoRoot.spheres) { mujocoRoot.spheres.setMatrixAt(numWraps, mat.compose(tendonStart, new THREE.Quaternion(), new THREE.Vector3(r, r, r))); }
					if (validEnd && mujocoRoot.spheres) { mujocoRoot.spheres.setMatrixAt(numWraps + 1, mat.compose(tendonEnd, new THREE.Quaternion(), new THREE.Vector3(r, r, r))); }
					if (validStart && validEnd) {
						mat.compose(tendonAvg, new THREE.Quaternion().setFromUnitVectors(
							new THREE.Vector3(0, 1, 0), tendonEnd.clone().sub(tendonStart).normalize()),
							new THREE.Vector3(r, tendonStart.distanceTo(tendonEnd), r));
						if (mujocoRoot.cylinders) {
							mujocoRoot.cylinders.setMatrixAt(numWraps, mat);
						}
						numWraps++;
					}
				}
			}
			if (mujocoRoot.cylinders) {
				mujocoRoot.cylinders.count = numWraps;
				mujocoRoot.cylinders.instanceMatrix.needsUpdate = true;
			}
			if (mujocoRoot.spheres) {
				mujocoRoot.spheres.count = numWraps > 0 ? numWraps + 1 : 0;
				mujocoRoot.spheres.instanceMatrix.needsUpdate = true;
			}
		}
		renderer.render(scene, camera);
	}
</script>

<div bind:this={container} class="w-full h-full" />
