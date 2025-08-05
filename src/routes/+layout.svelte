<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { mujocoInstance } from '$lib/stores';
	import { downloadExampleScenes } from '$lib/mujoco/mujoco-utils';

	let { children } = $props();

	let mujoco: typeof import('mujoco_wasm_contrib').mujoco | null = null;
	mujocoInstance.subscribe((value) => {
		mujoco = value;
	});

	async function onDownloadExampleScenes() {
		if (mujoco) {
			await downloadExampleScenes(mujoco);
			alert('Example scenes downloaded and mounted.');
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
			<Dialog.Content class="sm:max-w-[425px]">
				<Dialog.Header>
					<Dialog.Title>Debug</Dialog.Title>
					<Dialog.Description>Debug information will be displayed here.</Dialog.Description>
				</Dialog.Header>
				<div class="grid gap-4 py-4">
					<Button onclick={onDownloadExampleScenes} disabled={!mujoco}>
						Download Example Scenes
					</Button>
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
