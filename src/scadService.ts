import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

interface OpenSCADWorker {
  postMessage: (message: any) => void;
  onmessage: ((event: MessageEvent) => void) | null;
}

class ScadService {
  private worker: OpenSCADWorker | null = null;

  async initialize() {
    // Load OpenSCAD.js web worker
    this.worker = new Worker('/openscad-worker.js');
  }

  compileToSTL(scadCode: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      this.worker.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.stl);
        }
      };

      this.worker.postMessage({
        type: 'compile',
        code: scadCode
      });
    });
  }

  async loadSTLIntoGeometry(stlData: ArrayBuffer): Promise<THREE.BufferGeometry> {
    const loader = new STLLoader();
    return loader.parse(stlData);
  }
}

export const scadService = new ScadService();