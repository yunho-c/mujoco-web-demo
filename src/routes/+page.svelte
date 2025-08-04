<script lang="ts">
	import WebcamPose from '$lib/components/WebcamPose.svelte';
</script>

<main class="grid grid-cols-[1fr,min(80ch,100%),1fr] gap-y-8 py-8">
	<div class="col-start-2 px-4">
		<div class="text-center">
			<h1
				class="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none"
			>
				Web Robot Teleop Demo
			</h1>
			<p
				class="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed"
			>
				A demonstration of Kong's extremely fast and accurate geometric IK solver.
			</p>
		</div>
	</div>

	<div class="col-span-3 grid grid-cols-2 gap-8 bg-muted p-8 text-muted-foreground">
		<div class="col-span-1">
			<WebcamPose />
		</div>
		<div class="col-span-1">
			<p class="text-center">This is the right half of the full-width section.</p>
		</div>
	</div>

	<div class="col-start-2 px-4">
		<p>
			This is another constrained section. You can add more content here, and it will remain within
			the main column.
		</p>
	</div>
</main>
