// @ts-nocheck
import { reloadFunc } from '$lib/mujoco/mujoco-utils';
import { scenes, selectedScene } from '$lib/stores';
import { get } from 'svelte/store';

/** @param {MuJoCoDemo} parentContext*/
export function setupGUI(parentContext) {
	// Make sure we reset the camera when the scene is changed or reloaded.
	parentContext.updateGUICallbacks.length = 0;
	parentContext.updateGUICallbacks.push((model, simulation, params) => {
		// TODO: Use free camera parameters from MuJoCo
		parentContext.camera.position.set(2.0, 1.7, 1.7);
		parentContext.controls.target.set(0, 0.7, 0);
		parentContext.controls.update();
	});

	// Add scene selection dropdown.
	let reload = reloadFunc.bind(parentContext);
	const sceneOptions = get(scenes);
	parentContext.gui
		.add(parentContext.params, 'scene', sceneOptions)
		.name('Example Scene')
		.onChange((value) => {
			selectedScene.set(value);
			reload(value);
      alert("scene selector updated")
		});

	// Add a help menu.
	// Parameters:
	//  Name: "Help".
	//  When pressed, a help menu is displayed in the top left corner. When pressed again
	//  the help menu is removed.
	//  Can also be triggered by pressing F1.
	// Has a dark transparent background.
	// Has two columns: one for putting the action description, and one for the action key trigger.keyframeNumber
	let keyInnerHTML = '';
	let actionInnerHTML = '';
	const displayHelpMenu = () => {
		if (parentContext.params.help) {
			const helpMenu = document.createElement('div');
			helpMenu.style.position = 'absolute';
			helpMenu.style.top = '10px';
			helpMenu.style.left = '10px';
			helpMenu.style.color = 'white';
			helpMenu.style.font = 'normal 18px Arial';
			helpMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
			helpMenu.style.padding = '10px';
			helpMenu.style.borderRadius = '10px';
			helpMenu.style.display = 'flex';
			helpMenu.style.flexDirection = 'column';
			helpMenu.style.alignItems = 'center';
			helpMenu.style.justifyContent = 'center';
			helpMenu.style.width = '400px';
			helpMenu.style.height = '400px';
			helpMenu.style.overflow = 'auto';
			helpMenu.style.zIndex = '1000';

			const helpMenuTitle = document.createElement('div');
			helpMenuTitle.style.font = 'bold 24px Arial';
			helpMenuTitle.innerHTML = '';
			helpMenu.appendChild(helpMenuTitle);

			const helpMenuTable = document.createElement('table');
			helpMenuTable.style.width = '100%';
			helpMenuTable.style.marginTop = '10px';
			helpMenu.appendChild(helpMenuTable);

			const helpMenuTableBody = document.createElement('tbody');
			helpMenuTable.appendChild(helpMenuTableBody);

			const helpMenuRow = document.createElement('tr');
			helpMenuTableBody.appendChild(helpMenuRow);

			const helpMenuActionColumn = document.createElement('td');
			helpMenuActionColumn.style.width = '50%';
			helpMenuActionColumn.style.textAlign = 'right';
			helpMenuActionColumn.style.paddingRight = '10px';
			helpMenuRow.appendChild(helpMenuActionColumn);

			const helpMenuKeyColumn = document.createElement('td');
			helpMenuKeyColumn.style.width = '50%';
			helpMenuKeyColumn.style.textAlign = 'left';
			helpMenuKeyColumn.style.paddingLeft = '10px';
			helpMenuRow.appendChild(helpMenuKeyColumn);

			const helpMenuActionText = document.createElement('div');
			helpMenuActionText.innerHTML = actionInnerHTML;
			helpMenuActionColumn.appendChild(helpMenuActionText);

			const helpMenuKeyText = document.createElement('div');
			helpMenuKeyText.innerHTML = keyInnerHTML;
			helpMenuKeyColumn.appendChild(helpMenuKeyText);

			// Close buttom in the top.
			const helpMenuCloseButton = document.createElement('button');
			helpMenuCloseButton.innerHTML = 'Close';
			helpMenuCloseButton.style.position = 'absolute';
			helpMenuCloseButton.style.top = '10px';
			helpMenuCloseButton.style.right = '10px';
			helpMenuCloseButton.style.zIndex = '1001';
			helpMenuCloseButton.onclick = () => {
				helpMenu.remove();
			};
			helpMenu.appendChild(helpMenuCloseButton);

			document.body.appendChild(helpMenu);
		} else {
			document.body.removeChild(document.body.lastChild);
		}
	};
	document.addEventListener('keydown', (event) => {
		if (event.key === 'F1') {
			parentContext.params.help = !parentContext.params.help;
			displayHelpMenu();
			event.preventDefault();
		}
	});
	keyInnerHTML += 'F1<br>';
	actionInnerHTML += 'Help<br>';

	let simulationFolder = parentContext.gui.addFolder('Simulation');

	// Add pause simulation checkbox.
	// Parameters:
	//  Under "Simulation" folder.
	//  Name: "Pause Simulation".
	//  When paused, a "pause" text in white is displayed in the top left corner.
	//  Can also be triggered by pressing the spacebar.
	const pauseSimulation = simulationFolder
		.add(parentContext.params, 'paused')
		.name('Pause Simulation');
	pauseSimulation.onChange((value) => {
		if (value) {
			const pausedText = document.createElement('div');
			pausedText.style.position = 'absolute';
			pausedText.style.top = '10px';
			pausedText.style.left = '10px';
			pausedText.style.color = 'white';
			pausedText.style.font = 'normal 18px Arial';
			pausedText.innerHTML = 'pause';
			parentContext.container.appendChild(pausedText);
		} else {
			parentContext.container.removeChild(parentContext.container.lastChild);
		}
	});
	document.addEventListener('keydown', (event) => {
		if (event.code === 'Space') {
			parentContext.params.paused = !parentContext.params.paused;
			pauseSimulation.setValue(parentContext.params.paused);
			event.preventDefault();
		}
	});
	actionInnerHTML += 'Play / Pause<br>';
	keyInnerHTML += 'Space<br>';

	// Add reload model button.
	// Parameters:
	//  Under "Simulation" folder.
	//  Name: "Reload".
	//  When pressed, calls the reload function.
	//  Can also be triggered by pressing ctrl + L.
	simulationFolder
		.add(
			{
				reload: () => {
					reload();
				}
			},
			'reload'
		)
		.name('Reload');
	document.addEventListener('keydown', (event) => {
		if (event.ctrlKey && event.code === 'KeyL') {
			reload();
			event.preventDefault();
		}
	});
	actionInnerHTML += 'Reload XML<br>';
	keyInnerHTML += 'Ctrl L<br>';

	// Add reset simulation button.
	// Parameters:
	//  Under "Simulation" folder.
	//  Name: "Reset".
	//  When pressed, resets the simulation to the initial state.
	//  Can also be triggered by pressing backspace.
	const resetSimulation = () => {
		parentContext.simulation.resetData();
		parentContext.simulation.forward();
	};
	simulationFolder
		.add(
			{
				reset: () => {
					resetSimulation();
				}
			},
			'reset'
		)
		.name('Reset');
	document.addEventListener('keydown', (event) => {
		if (event.code === 'Backspace') {
			resetSimulation();
			event.preventDefault();
		}
	});
	actionInnerHTML += 'Reset simulation<br>';
	keyInnerHTML += 'Backspace<br>';

	// Add keyframe slider.
	let nkeys = parentContext.model.nkey;
	let keyframeGUI = simulationFolder
		.add(parentContext.params, 'keyframeNumber', 0, nkeys - 1, 1)
		.name('Load Keyframe')
		.listen();
	keyframeGUI.onChange((value) => {
		if (value < parentContext.model.nkey) {
			parentContext.simulation.qpos.set(
				parentContext.model.key_qpos.slice(
					value * parentContext.model.nq,
					(value + 1) * parentContext.model.nq
				)
			);
		}
	});
	parentContext.updateGUICallbacks.push((model, simulation, params) => {
		let nkeys = parentContext.model.nkey;
		console.log('new model loaded. has ' + nkeys + ' keyframes.');
		if (nkeys > 0) {
			keyframeGUI.max(nkeys - 1);
			keyframeGUI.domElement.style.opacity = 1.0;
		} else {
			// Disable keyframe slider if no keyframes are available.
			keyframeGUI.max(0);
			keyframeGUI.domElement.style.opacity = 0.5;
		}
	});

	// Add sliders for ctrlnoiserate and ctrlnoisestd; min = 0, max = 2, step = 0.01.
	simulationFolder.add(parentContext.params, 'ctrlnoiserate', 0.0, 2.0, 0.01).name('Noise rate');
	simulationFolder.add(parentContext.params, 'ctrlnoisestd', 0.0, 2.0, 0.01).name('Noise scale');

	let textDecoder = new TextDecoder('utf-8');
	let nullChar = textDecoder.decode(new ArrayBuffer(1));

	// Add actuator sliders.
	let actuatorFolder = simulationFolder.addFolder('Actuators');
	const addActuators = (model, simulation, params) => {
		let act_range = model.actuator_ctrlrange;
		let actuatorGUIs = [];
		for (let i = 0; i < model.nu; i++) {
			if (!model.actuator_ctrllimited[i]) {
				continue;
			}
			let name = textDecoder
				.decode(parentContext.model.names.subarray(parentContext.model.name_actuatoradr[i]))
				.split(nullChar)[0];

			parentContext.params[name] = 0.0;
			let actuatorGUI = actuatorFolder
				.add(parentContext.params, name, act_range[2 * i], act_range[2 * i + 1], 0.01)
				.name(name)
				.listen();
			actuatorGUIs.push(actuatorGUI);
			actuatorGUI.onChange((value) => {
				simulation.ctrl[i] = value;
			});
		}
		return actuatorGUIs;
	};
	let actuatorGUIs = addActuators(
		parentContext.model,
		parentContext.simulation,
		parentContext.params
	);
	parentContext.updateGUICallbacks.push((model, simulation, params) => {
		for (let i = 0; i < actuatorGUIs.length; i++) {
			actuatorGUIs[i].destroy();
		}
		actuatorGUIs = addActuators(model, simulation, parentContext.params);
	});
	actuatorFolder.close();

	// Add function that resets the camera to the default position.
	// Can be triggered by pressing ctrl + A.
	document.addEventListener('keydown', (event) => {
		if (event.ctrlKey && event.code === 'KeyA') {
			// TODO: Use free camera parameters from MuJoCo
			parentContext.camera.position.set(2.0, 1.7, 1.7);
			parentContext.controls.target.set(0, 0.7, 0);
			parentContext.controls.update();
			event.preventDefault();
		}
	});
	actionInnerHTML += 'Reset free camera<br>';
	keyInnerHTML += 'Ctrl A<br>';

	parentContext.gui.open();
}
