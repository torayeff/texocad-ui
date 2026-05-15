import type * as THREE from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";

export interface ViewerRuntime {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  environmentMap: THREE.Texture;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
}
