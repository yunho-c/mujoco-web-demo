<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		PoseLandmarker,
		FilesetResolver,
		DrawingUtils,
		type PoseLandmarkerResult,
		type LandmarkData
	} from '@mediapipe/tasks-vision';
	import { Button } from '$lib/components/ui/button/index.js';

	let poseLandmarker: PoseLandmarker | undefined = undefined;
	let webcamRunning = false;
	$: buttonText = webcamRunning ? 'DISABLE WEBCAM' : 'ENABLE WEBCAM';
	let video: HTMLVideoElement;
	let canvasElement: HTMLCanvasElement;
	let canvasCtx: CanvasRenderingContext2D;
	let drawingUtils: DrawingUtils;
	let lastVideoTime = -1;

	const renderLoop = () => {
		if (video.currentTime !== lastVideoTime) {
			lastVideoTime = video.currentTime;
			const startTimeMs = performance.now();
			poseLandmarker!.detectForVideo(video, startTimeMs, (result: PoseLandmarkerResult) => {
				canvasCtx.save();
				canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
				for (const landmark of result.landmarks) {
					drawingUtils.drawLandmarks(landmark, {
						radius: (data: LandmarkData) => DrawingUtils.lerp(data.from!.z, -0.15, 0.1, 5, 1)
					});
					drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
				}
				canvasCtx.restore();
			});
		}
		if (webcamRunning) {
			window.requestAnimationFrame(renderLoop);
		}
	};

	const startWebcam = () => {
		if (!webcamRunning) {
			webcamRunning = true;
			window.requestAnimationFrame(renderLoop);
		}
	};

	const enableCam = async () => {
		if (!poseLandmarker) {
			return;
		}

		if (webcamRunning) {
			// Stop webcam
			webcamRunning = false;
			const stream = video.srcObject as MediaStream;
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
			}
			video.srcObject = null;
		} else {
			// Start webcam
			const stream = await navigator.mediaDevices.getUserMedia({ video: true });
			video.srcObject = stream;
			// The listener will call startWebcam
		}
	};

	onMount(async () => {
		const createPoseLandmarker = async () => {
			const vision = await FilesetResolver.forVisionTasks('/wasm');
			poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
					delegate: 'GPU'
				},
				runningMode: 'VIDEO',
				numPoses: 2
			});
		};
		await createPoseLandmarker();
		canvasCtx = canvasElement.getContext('2d')!;
		drawingUtils = new DrawingUtils(canvasCtx);
		video.addEventListener('loadeddata', startWebcam);
	});

	onDestroy(() => {
		// Clean up listener
		if (video) {
			video.removeEventListener('loadeddata', startWebcam);
		}
		// Stop webcam if it's running
		if (webcamRunning) {
			const stream = video.srcObject as MediaStream;
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
			}
			video.srcObject = null;
		}
	});
</script>

<div class="flex flex-col items-center gap-4">
	<div class="relative w-full">
		<video bind:this={video} class="h-auto w-full" autoplay playsinline></video>
		<canvas
			bind:this={canvasElement}
			class="output_canvas absolute left-0 top-0 h-full w-full"
			width="1280"
			height="720"
		></canvas>
	</div>
	<Button on:click={enableCam} disabled={!poseLandmarker}>{buttonText}</Button>
</div>

<style>
	.output_canvas {
		transform: rotateY(180deg);
		-webkit-transform: rotateY(180deg);
		-moz-transform: rotateY(180deg);
	}
	video {
		display: block;
		transform: rotateY(180deg);
		-webkit-transform: rotateY(180deg);
		-moz-transform: rotateY(180deg);
	}
</style>
