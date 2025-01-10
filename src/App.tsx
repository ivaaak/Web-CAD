import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EditMode, EditableVertex, SceneState, ShapeType } from './types';
import styles from './App.module.css';
import { TransformControls } from './TransformControls';
import { VertexEditor } from './VertexEditor';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sceneState, setSceneState] = useState<SceneState>({
    scene: null,
    camera: null,
    renderer: null
  });
  const [selectedObject, setSelectedObject] = useState<THREE.Mesh | null>(null);
  const [editMode, setEditMode] = useState<EditMode>('transform');
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 5;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(ambientLight);
    scene.add(directionalLight);

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    setSceneState({ scene, camera, renderer });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  const handleImportSTL = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !sceneState.scene) return;

    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e: ProgressEvent<FileReader>) {
      if (!e.target?.result || !sceneState.scene) return;

      const geometry = new STLLoader().parse(e.target.result as ArrayBuffer);
      const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
      const mesh = new THREE.Mesh(geometry, material);

      // Center the imported model
      geometry.computeBoundingBox();
      const center = geometry.boundingBox?.getCenter(new THREE.Vector3());
      if (center) {
        geometry.translate(-center.x, -center.y, -center.z);
      }

      sceneState.scene.add(mesh);
      setSelectedObject(mesh);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleExportSTL = (): void => {
    if (!selectedObject || !sceneState.scene) return;

    const exporter = new STLExporter();
    const str = exporter.parse(sceneState.scene);
    const blob = new Blob([str], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'model.stl');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const addBasicShape = (type: ShapeType): void => {
    if (!sceneState.scene) return;

    let geometry: THREE.BufferGeometry;

    switch (type) {
      case 'cube':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, 32, 32);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        break;
      default:
        return;
    }

    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    sceneState.scene.add(mesh);
    setSelectedObject(mesh);
  };

  const handleVertexUpdate = (vertices: EditableVertex[]) => {
    if (!selectedObject) return;

    const geometry = selectedObject.geometry;
    const positions = geometry.attributes.position;

    vertices.forEach((vertex) => {
      positions.setXYZ(
        vertex.index,
        vertex.position.x,
        vertex.position.y,
        vertex.position.z
      );
    });

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  const subdivide = () => {
    if (!selectedObject || !sceneState.scene) return;

    const geometry = selectedObject.geometry;
    // Create new geometry with subdivided faces
    const newGeometry = new THREE.BufferGeometry();
    const positions = geometry.attributes.position;
    const indices = geometry.index;

    if (!indices) return;

    const newPositions: number[] = [];
    const newIndices: number[] = [];

    // For each face, create new vertices at the midpoints
    for (let i = 0; i < indices.count; i += 3) {
      const idx1 = indices.getX(i);
      const idx2 = indices.getX(i + 1);
      const idx3 = indices.getX(i + 2);

      const v1 = new THREE.Vector3(
        positions.getX(idx1),
        positions.getY(idx1),
        positions.getZ(idx1)
      );
      const v2 = new THREE.Vector3(
        positions.getX(idx2),
        positions.getY(idx2),
        positions.getZ(idx2)
      );
      const v3 = new THREE.Vector3(
        positions.getX(idx3),
        positions.getY(idx3),
        positions.getZ(idx3)
      );

      // Calculate midpoints
      const m1 = v1.clone().lerp(v2, 0.5);
      const m2 = v2.clone().lerp(v3, 0.5);
      const m3 = v3.clone().lerp(v1, 0.5);

      // Add new vertices
      const startIdx = newPositions.length / 3;
      newPositions.push(
        ...v1.toArray(),
        ...v2.toArray(),
        ...v3.toArray(),
        ...m1.toArray(),
        ...m2.toArray(),
        ...m3.toArray()
      );

      // Create new faces
      newIndices.push(
        startIdx, startIdx + 3, startIdx + 5,
        startIdx + 3, startIdx + 1, startIdx + 4,
        startIdx + 5, startIdx + 4, startIdx + 2,
        startIdx + 3, startIdx + 4, startIdx + 5
      );
    }

    newGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(newPositions, 3)
    );
    newGeometry.setIndex(newIndices);
    newGeometry.computeVertexNormals();

    const newMesh = new THREE.Mesh(
      newGeometry,
      selectedObject.material
    );

    sceneState.scene.remove(selectedObject);
    sceneState.scene.add(newMesh);
    setSelectedObject(newMesh);
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <input
          type="file"
          accept=".stl"
          onChange={handleImportSTL}
          className={styles.fileInput}
        />
        <button onClick={handleExportSTL} className={styles.button}>
          Export STL
        </button>
        <button onClick={() => addBasicShape('cube')} className={styles.button}>
          Add Cube
        </button>
        <button onClick={() => addBasicShape('sphere')} className={styles.button}>
          Add Sphere
        </button>
        <button onClick={() => addBasicShape('cylinder')} className={styles.button}>
          Add Cylinder
        </button>

        <div className={styles.editControls}>
          <select
            value={editMode}
            onChange={(e) => setEditMode(e.target.value as EditMode)}
            className={styles.select}
          >
            <option value="transform">Transform</option>
            <option value="vertex">Vertex Edit</option>
            <option value="face">Face Edit</option>
            <option value="edge">Edge Edit</option>
          </select>

          {editMode === 'transform' && (
            <select
              value={transformMode}
              onChange={(e) => setTransformMode(e.target.value as 'translate' | 'rotate' | 'scale')}
              className={styles.select}
            >
              <option value="translate">Move</option>
              <option value="rotate">Rotate</option>
              <option value="scale">Scale</option>
            </select>
          )}

          <button onClick={subdivide} className={styles.button}>
            Subdivide
          </button>
        </div>
      </div>

      {sceneState.scene && sceneState.camera && canvasRef.current && (
        <>
          {editMode === 'transform' && (
            <TransformControls
              scene={sceneState.scene}
              camera={sceneState.camera}
              domElement={canvasRef.current}
              object={selectedObject}
              mode={transformMode}
            />
          )}

          {editMode === 'vertex' && (
            <VertexEditor
              scene={sceneState.scene}
              selectedMesh={selectedObject}
              onVertexUpdate={handleVertexUpdate}
            />
          )}
        </>
      )}
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
};

export default App;