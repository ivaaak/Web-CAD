import { Object3D, Camera } from 'three';

declare class TransformControls extends Object3D {
  constructor(camera: Camera, domElement?: HTMLElement);
  
  // Properties
  camera: Camera;
  domElement: HTMLElement;
  enabled: boolean;
  size: number;
  showX: boolean;
  showY: boolean;
  showZ: boolean;
  
  // Methods
  attach(object: Object3D): this;
  detach(): this;
  dispose(): void;
  getMode(): string;
  setMode(mode: 'translate' | 'rotate' | 'scale'): void;
  setSpace(space: 'world' | 'local'): void;
  setSize(size: number): void;
  setTranslationSnap(translationSnap: number | null): void;
  setRotationSnap(rotationSnap: number | null): void;
  setScaleSnap(scaleSnap: number | null): void;
}