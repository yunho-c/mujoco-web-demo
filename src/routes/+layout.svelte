<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Web Robot Teleop Demo</title>
</svelte:head>

<header class="px-4 lg:px-6 h-14 flex items-center">
	<a class="flex items-center justify-center" href="/">
		<span class="font-semibold">Web Robot Teleop Demo</span>
	</a>
	<nav class="mx-auto flex gap-4 sm:gap-6">
		<Button variant="ghost" href="/" class="text-sm font-medium">
			Project
		</Button>
		<Button variant="ghost" href="/comparison" class="text-sm font-medium">
			Comparison
		</Button>
		<Button variant="ghost" href="/tasks" class="text-sm font-medium">
			Tasks
		</Button>
		<Button variant="ghost" href="/people" class="text-sm font-medium">
			People
		</Button>
	</nav>
	<nav class="flex gap-4 sm:gap-6">
		<Button
			variant="link"
			href="https://TODO.com"
			class="text-sm font-medium"
		>
			arXiv
		</Button>
		<Button
			variant="link"
			href="https://TODO.com"
			class="text-sm font-medium"
		>
			GitHub
		</Button>
	</nav>
</header>

{@render children?.()}

<footer class="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
	<!-- <p class="text-xs text-gray-500 dark:text-gray-400">© 2025 Safe Robotics Lab at Georgia Tech. All rights reserved.</p> -->
	<p class="text-xs text-gray-500 dark:text-gray-400">
		© 2025
		<Button
			variant="link"
			href="https://saferoboticslab.me.gatech.edu/"
			class="text-xs p-0 h-auto font-normal text-gray-500 dark:text-gray-400"
			target="_blank"
		>
			Safe Robotics Lab at Georgia Tech.
		</Button>
		All rights reserved.
	</p>
	<nav class="sm:ml-auto flex gap-4 sm:gap-6">
		<Button variant="link" href="https://github.com/safe-robotics-lab-gt" class="text-xs">
			Safe Robotics Lab @ GitHub
		</Button>
		<!-- <Button variant="link" href="#" class="text-xs">
			Privacy
		</Button> -->
	</nav>
</footer>
