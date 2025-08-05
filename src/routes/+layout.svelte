<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { mujocoInstance, scenes, selectedScene } from '$lib/stores';
	import { downloadExampleScenes } from '$lib/mujoco/mujoco-utils';
	import { loadSceneWithAssets } from '$lib/services/mujocoAssetLoader';
	import { onMount } from 'svelte';
	let { children } = $props();

	let mujoco: import('mujoco_wasm_contrib').mujoco | null = null;
	mujocoInstance.subscribe((value) => {
		mujoco = value;
	});

	onMount(() => {
		const defaultScenes = {
			Humanoid: 'humanoid.xml',
			Cassie: 'agility_cassie/scene.xml',
			Hammock: 'hammock.xml',
			Balloons: 'balloons.xml',
			Hand: 'shadow_hand/scene_right.xml',
			Flag: 'flag.xml',
			Mug: 'mug.xml',
			Tendon: 'model_with_tendon.xml'
		};
		scenes.set(defaultScenes);
		selectedScene.set(defaultScenes.Humanoid);
	});

	function onSceneSelect(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedScene.set(target.value);
	}

	async function onDownloadExampleScenes() {
		if (mujoco) {
			await downloadExampleScenes(mujoco);
			alert('Example scenes downloaded and mounted.'); // TODO: replace with shadcn-svelte's `Alert`
		}
	}

	async function onDownloadRobots() {
		if (mujoco) {
			await loadSceneWithAssets(mujoco, 'models/rby1a/mujoco/rby1a.xml');
			await loadSceneWithAssets(mujoco, 'models/unitree_g1/g1.xml');
			alert('Robots downloaded and mounted.'); // TODO: replace with shadcn-svelte's `Alert`
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Web Robot Teleop Demo</title>
</svelte:head>

<header class="flex h-14 items-center px-4 lg:px-6">
	<a class="flex items-center justify-center" href="/">
		<span class="font-semibold">Web Robot Teleop Demo</span>
	</a>
	<nav class="mx-auto flex gap-4 sm:gap-6">
		<Button variant="ghost" href="/" class="text-sm font-medium">Project</Button>
		<Button variant="ghost" href="/comparison" class="text-sm font-medium">Comparison</Button>
		<Button variant="ghost" href="/tasks" class="text-sm font-medium">Tasks</Button>
		<Button variant="ghost" href="/people" class="text-sm font-medium">People</Button>
	</nav>
	<nav class="flex gap-4 sm:gap-6">
		<Button variant="link" href="https://TODO.com" class="text-sm font-medium">arXiv</Button>
		<Button variant="link" href="https://TODO.com" class="text-sm font-medium">GitHub</Button>
	</nav>
</header>

{@render children?.()}

<footer
	class="flex w-full shrink-0 flex-col items-center gap-2 border-t px-4 py-6 sm:flex-row md:px-6"
>
	<!-- <p class="text-xs text-gray-500 dark:text-gray-400">© 2025 Safe Robotics Lab at Georgia Tech. All rights reserved.</p> -->
	<p class="text-xs text-gray-500 dark:text-gray-400">
		© 2025
		<Button
			variant="link"
			href="https://saferoboticslab.me.gatech.edu/"
			class="h-auto p-0 text-xs font-normal text-gray-500 dark:text-gray-400"
			target="_blank"
		>
			Safe Robotics Lab at Georgia Tech.
		</Button>
		All rights reserved.
	</p>
	<nav class="flex gap-4 sm:ml-auto sm:gap-6">
		<Dialog.Root>
			<Dialog.Trigger>
				<Button variant="link" class="text-xs opacity-50">Debug</Button>
			</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-50%">
				<Dialog.Header>
					<Dialog.Title>Debug</Dialog.Title>
					<!-- <Dialog.Description>Debug information will be displayed here.</Dialog.Description> -->
				</Dialog.Header>
				<div class="grid gap-4 py-4">
					<Button onclick={onDownloadExampleScenes} disabled={!mujoco}>
						Download Example Scenes
					</Button>
					<Button onclick={onDownloadRobots} disabled={!mujoco}>Download Main Robots</Button>
				</div>
				<div class="grid gap-4 py-4">
					<Card.Root>
						<Card.Header>
							<Card.Title>Scenes</Card.Title>
						</Card.Header>
						<Card.Content>
							{#if $scenes}
								<pre>{JSON.stringify($scenes, null, 2)}</pre>
							{/if}
						</Card.Content>
					</Card.Root>
				</div>
				<div class="grid gap-4 py-4">
					<Card.Root>
						<Card.Header>
							<Card.Title>Select Scene (Debug)</Card.Title>
						</Card.Header>
						<Card.Content>
							{#if $scenes && $selectedScene}
								<select class="w-full p-2" on:change={onSceneSelect}>
									{#each Object.entries($scenes) as [name, path]}
										<option value={path} selected={$selectedScene === path}>{name}</option>
									{/each}
								</select>
							{/if}
						</Card.Content>
					</Card.Root>
				</div>
				<Dialog.Footer>
					<Dialog.Close>
						<Button type="submit">Close</Button>
					</Dialog.Close>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
		<Button variant="link" href="https://github.com/safe-robotics-lab-gt" class="text-xs">
			Safe Robotics Lab @ GitHub
		</Button>
		<!-- <Button variant="link" href="#" class="text-xs">
			Privacy
		</Button> -->
	</nav>
</footer>
