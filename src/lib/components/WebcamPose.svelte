<script lang="ts">
	import { onMount } from 'svelte';
	import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

	let poseLandmarker: PoseLandmarker | undefined = undefined;
	let runningMode = 'VIDEO';
	let enableWebcamButton: HTMLButtonElement;
	let webcamRunning = false;
	let video: HTMLVideoElement;
	let canvasElement: HTMLCanvasElement;
	let canvasCtx: CanvasRenderingContext2D;

	onMount(async () => {
		const createPoseLandmarker = async () => {
			const vision = await FilesetResolver.forVisionTasks(
				'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
			);
			poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
					delegate: 'GPU'
				},
				runningMode: runningMode,
				numPoses: 2
			});
		};
		await createPoseLandmarker();
		canvasCtx = canvasElement.getContext('2d')!;
	});

	async function predictWebcam() {
		if (!poseLandmarker) return;

		let lastVideoTime = -1;
		const drawingUtils = new DrawingUtils(canvasCtx);

		const renderLoop = () => {
			if (video.currentTime !== lastVideoTime) {
				lastVideoTime = video.currentTime;
				let startTimeMs = performance.now();
				poseLandmarker.detectForVideo(video, startTimeMs, (result: { landmarks: any[]; }) => {
					canvasCtx.save();
					canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
					for (const landmark of result.landmarks) {
						drawingUtils.drawLandmarks(landmark, {
							radius: (data: { from: { z: number; }; }) => DrawingUtils.lerp(data.from!.z, -0.15, 0.1, 5, 1)
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

		const stream = await navigator.mediaDevices.getUserMedia({ video: true });
		video.srcObject = stream;
		video.addEventListener('loadeddata', () => {
			webcamRunning = true;
			renderLoop();
		});
	}

	function enableCam() {
		if (!poseLandmarker) {
			console.log('Wait! poseLandmaker not loaded yet.');
			return;
		}

		if (webcamRunning) {
			webcamRunning = false;
			const stream = video.srcObject as MediaStream;
			stream.getTracks().forEach((track) => track.stop());
			video.srcObject = null;
			enableWebcamButton.innerText = 'ENABLE WEBCAM';
		} else {
			enableWebcamButton.innerText = 'DISABLE WEBCAM';
			predictWebcam();
		}
	}
</script>

<div class="videoView">
	<button bind:this={enableWebcamButton} on:click={enableCam} class="mdc-button mdc-button--raised">
		<span class="mdc-button__ripple"></span>
		<span class="mdc-button__label">ENABLE WEBCAM</span>
	</button>
	<div style="position: relative;">
		<video bind:this={video} style="width: 100%; height: auto; position: abso" autoplay playsinline></video>
		<canvas
			bind:this={canvasElement}
			class="output_canvas"
			width="1280"
			height="720"
			style="position: absolute; left: 0px; top: 0px; width: 100%; height: 100%;"
		></canvas>
	</div>
</div>

<style>
	.videoView {
		position: relative;
		width: 100%;
		height: 100%;
	}
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
