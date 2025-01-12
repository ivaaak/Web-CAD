import { Scene, PerspectiveCamera, WebGLRenderer, Mesh, Vector3 } from 'three';

export interface SceneState {
  scene: Scene | null;
  camera: PerspectiveCamera | null;
  renderer: WebGLRenderer | null;
}

export type ShapeType = 'cube' | 'sphere' | 'cylinder';

export type EditMode = 'transform' | 'vertex' | 'face' | 'edge';

export interface EditableVertex {
  position: Vector3;
  index: number;
}