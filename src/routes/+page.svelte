<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<main class="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
	<Card.Root class="w-full max-w-2xl">
		<Card.Header class="text-center">
			<Card.Title
				class="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none text-gray-900 dark:text-gray-50"
			>
				Web-based Robot Teleoperation
			</Card.Title>
			<Card.Description
				class="mx-auto max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400"
			>
				An open-source, web-based robot teleoperation interface.
			</Card.Description>
		</Card.Header>
		<Card.Footer class="flex justify-center">
			<Button href="https://TODO.com">
				Learn More
			</Button>
		</Card.Footer>
	</Card.Root>
</main>
