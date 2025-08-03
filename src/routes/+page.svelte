<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<main class="grid grid-cols-[1fr,min(80ch,100%),1fr] gap-y-8 py-8">
	<div class="col-start-2 px-4">
		<Card.Root>
			<Card.Header class="text-center">
				<Card.Title
					class="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none"
				>
					Web Robot Teleop Demo
				</Card.Title>
				<Card.Description
					class="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed"
				>
					A demonstration of Kong's extremely fast and accurate geometric IK solver.
				</Card.Description>
			</Card.Header>
			<Card.Footer class="flex justify-center">
				<Button href="https://TODO.com"> Learn More </Button>
			</Card.Footer>
		</Card.Root>
	</div>

	<div class="col-span-3 bg-muted text-muted-foreground p-8">
		<p class="text-center">This is a full-width section.</p>
	</div>

	<div class="col-start-2 px-4">
		<p>
			This is another constrained section. You can add more content here, and it will remain within
			the main column.
		</p>
	</div>
</main>
