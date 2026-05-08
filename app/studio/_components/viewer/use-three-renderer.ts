import { type RefObject, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import { type ModelFormat } from "@/app/studio/_components/viewer/model-viewer-loaders";
import { type ViewPreset } from "@/app/studio/_components/viewer/model-viewer-state";
import {
  createAxisTriad,
  disposeObject,
  setCameraView,
} from "@/app/studio/_components/viewer/model-viewer-three";

const triadCameraDistance = 100;
const triadFrustum = 40;
const triadTopOffset = 68;
const triadViewportSize = 116;
const mobileTriadViewportSize = 70;
const mobileViewportBreakpoint = 640;

export interface ViewerRuntime {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  environmentMap: THREE.Texture;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
}

interface UseThreeRendererOptions {
  activeViewRef: RefObject<ViewPreset>;
  autoRotateRef: RefObject<boolean>;
  fitDistanceRef: RefObject<number>;
  modelGroupRef: RefObject<THREE.Group | null>;
  onBeforeDispose: () => void;
  onControlsStart: () => void;
}

function addSceneLights(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8290a3, 2.3));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(1, -1, 2);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xb9d7ff, 1.4);
  fillLight.position.set(-2, 1, 1);
  scene.add(fillLight);
}

function assertNever(value: never, message: string): never {
  throw new Error(`${message}: ${String(value)}`);
}

function createEnvironmentMap(renderer: THREE.WebGLRenderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const environmentScene = new RoomEnvironment();
  const environmentMap = pmremGenerator.fromScene(environmentScene, 0.04).texture;

  environmentScene.dispose();
  pmremGenerator.dispose();

  return environmentMap;
}

function clearEnvironment(scene: THREE.Scene, environmentMap: THREE.Texture) {
  if (scene.environment === environmentMap) {
    scene.environment = null;
  }
}

export function configureCadRenderer(renderer: THREE.WebGLRenderer, scene: THREE.Scene, environmentMap: THREE.Texture) {
  clearEnvironment(scene, environmentMap);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1;
}

function configurePbrRenderer(renderer: THREE.WebGLRenderer, scene: THREE.Scene, environmentMap: THREE.Texture) {
  scene.environment = environmentMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
}

export function configureRendererForFormat(
  format: ModelFormat,
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  environmentMap: THREE.Texture,
) {
  switch (format) {
    case "glb":
      configurePbrRenderer(renderer, scene, environmentMap);
      break;
    case "step":
    case "stl":
      configureCadRenderer(renderer, scene, environmentMap);
      break;
    default:
      assertNever(format, "Unhandled model format");
  }
}

function renderAxisTriad(
  renderer: THREE.WebGLRenderer,
  triadScene: THREE.Scene,
  triadCamera: THREE.OrthographicCamera,
  triad: THREE.Group,
  viewerCamera: THREE.PerspectiveCamera,
  width: number,
  height: number,
) {
  if (width <= 0 || height <= 0) {
    return;
  }

  const isMobileViewport = width < mobileViewportBreakpoint;
  const targetSize = isMobileViewport ? mobileTriadViewportSize : triadViewportSize;
  const size = Math.min(targetSize, Math.max(72, width - 24), Math.max(72, height - 24));
  const x = 0;
  const y = Math.max(0, height - size - triadTopOffset);

  triad.quaternion.copy(viewerCamera.quaternion).invert();
  triad.position.set(0, 0, 0);

  renderer.clearDepth();
  renderer.setScissorTest(true);
  renderer.setScissor(x, y, size, size);
  renderer.setViewport(x, y, size, size);
  renderer.render(triadScene, triadCamera);
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, width, height);
}

function configureControls(controls: OrbitControls, autoRotate: boolean) {
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = true;
  controls.autoRotate = autoRotate;
  controls.autoRotateSpeed = 0.6;
  controls.rotateSpeed = 0.7;
  controls.zoomSpeed = 0.9;
  controls.panSpeed = 0.8;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: THREE.MOUSE.PAN,
  };
}

export function useThreeRenderer({
  activeViewRef,
  autoRotateRef,
  fitDistanceRef,
  modelGroupRef,
  onBeforeDispose,
  onControlsStart,
}: UseThreeRendererOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<ViewerRuntime | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let viewportWidth = 0;
    let viewportHeight = 0;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100000);
    camera.up.set(0, 0, 1);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const triadScene = new THREE.Scene();
    const triadCamera = new THREE.OrthographicCamera(
      -triadFrustum,
      triadFrustum,
      triadFrustum,
      -triadFrustum,
      0.1,
      triadCameraDistance * 2,
    );
    triadCamera.position.set(0, 0, triadCameraDistance);
    triadCamera.lookAt(0, 0, 0);
    const axisTriad = createAxisTriad();
    triadScene.add(axisTriad);

    const controls = new OrbitControls(camera, renderer.domElement);
    configureControls(controls, autoRotateRef.current);
    controls.addEventListener("start", onControlsStart);
    const environmentMap = createEnvironmentMap(renderer);
    configureCadRenderer(renderer, scene, environmentMap);
    setCameraView(camera, controls, activeViewRef.current, fitDistanceRef.current);
    addSceneLights(scene);

    runtimeRef.current = {
      camera,
      controls,
      environmentMap,
      renderer,
      scene,
    };

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      viewportWidth = width;
      viewportHeight = height;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    renderer.setAnimationLoop(() => {
      controls.autoRotate = autoRotateRef.current;
      controls.update();
      renderer.setViewport(0, 0, viewportWidth, viewportHeight);
      renderer.setScissorTest(false);
      renderer.clear();
      renderer.render(scene, camera);
      if (modelGroupRef.current) {
        renderAxisTriad(renderer, triadScene, triadCamera, axisTriad, camera, viewportWidth, viewportHeight);
      }
    });

    return () => {
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      onBeforeDispose();
      controls.removeEventListener("start", onControlsStart);
      controls.dispose();
      clearEnvironment(scene, environmentMap);
      environmentMap.dispose();
      disposeObject(axisTriad);
      runtimeRef.current = null;
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [activeViewRef, autoRotateRef, fitDistanceRef, modelGroupRef, onBeforeDispose, onControlsStart]);

  return {
    containerRef,
    runtimeRef,
  };
}
