<script lang="ts">
	import { onMount } from 'svelte';
	import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
	import { Button } from '$lib/components/ui/button';

	let poseLandmarker: PoseLandmarker | undefined = undefined;
	let runningMode: 'VIDEO' | 'IMAGE' = 'VIDEO';
	let webcamRunning = false;
	let video: HTMLVideoElement;
	let canvasElement: HTMLCanvasElement;
	let canvasCtx: CanvasRenderingContext2D;

	onMount(async () => {
		const createPoseLandmarker = async () => {
			const vision = await FilesetResolver.forVisionTasks('/wasm');
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
				if (!poseLandmarker) return;
				poseLandmarker.detectForVideo(video, startTimeMs, (result) => {
					canvasCtx.save();
					canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
					for (const landmark of result.landmarks) {
						drawingUtils.drawLandmarks(landmark, {
							radius: (data) => {
								if (data.from) {
									return DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1);
								}
								return 1;
							}
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
		} else {
			predictWebcam();
		}
	}
</script>

<div class="videoView">
	<Button onclick={enableCam} class="primary text-sm font-medium">
		<!-- <span class="mdc-button__ripple"></span> -->
		<span class="mdc-button__label">{webcamRunning ? 'DISABLE WEBCAM' : 'ENABLE WEBCAM'}</span>
	</Button>
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
