import { useEffect, useState } from 'react';
import { Mesh, BufferGeometry, Points, PointsMaterial, BufferAttribute, Vector3, Scene } from 'three';
import { EditableVertex } from './types';

interface VertexEditorProps {
  scene: Scene;
  selectedMesh: Mesh | null;
  onVertexUpdate: (vertices: EditableVertex[]) => void;
}

export const VertexEditor: React.FC<VertexEditorProps> = ({
  scene, selectedMesh, onVertexUpdate
}) => {
  const [vertices, setVertices] = useState<EditableVertex[]>([]);

  useEffect(() => {
    if (!selectedMesh || !scene) return;

    const geometry = selectedMesh.geometry;
    const positions = geometry.attributes.position;
    const vertexPoints: EditableVertex[] = [];

    for (let i = 0; i < positions.count; i++) {
      vertexPoints.push({
        position: new Vector3(
          positions.getX(i),
          positions.getY(i),
          positions.getZ(i)
        ),
        index: i
      });
    }

    setVertices(vertexPoints);

    // Create visual helpers for vertices
    const pointsGeometry = new BufferGeometry();
    const pointsPositions = new Float32Array(vertexPoints.length * 3);
    vertexPoints.forEach((vertex, i) => {
      pointsPositions[i * 3] = vertex.position.x;
      pointsPositions[i * 3 + 1] = vertex.position.y;
      pointsPositions[i * 3 + 2] = vertex.position.z;
    });
    pointsGeometry.setAttribute('position', new BufferAttribute(pointsPositions, 3));
    
    const pointsMaterial = new PointsMaterial({ 
      size: 0.05, 
      color: 0xff0000 
    });
    const points = new Points(pointsGeometry, pointsMaterial);
    scene.add(points);

    return () => {
      scene.remove(points);
      points.geometry.dispose();
      points.material.dispose();
    };
  }, [selectedMesh, scene]);

  return null;
};