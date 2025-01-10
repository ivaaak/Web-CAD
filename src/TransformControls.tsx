import { TransformControls as ThreeTransformControls } from 'three/addons/controls/TransformControls.js';
import { useEffect } from 'react';
import { Scene, PerspectiveCamera, Mesh } from 'three';

interface TransformControlsProps {
  scene: Scene;
  camera: PerspectiveCamera;
  domElement: HTMLElement;
  object: Mesh | null;
  mode: 'translate' | 'rotate' | 'scale';
}

export const TransformControls: React.FC<TransformControlsProps> = ({
  scene, camera, domElement, object, mode
}) => {
  useEffect(() => {
    if (!object) return;

    const controls = new ThreeTransformControls(camera, domElement);
    controls.attach(object);
    controls.setMode(mode);
    
    // Instead of adding the controls to the scene, we just need to attach them to the object
    // The control's visual elements will be automatically added to the scene
    
    const onObjectChange = () => {
      // Update object when transformed
      object.updateMatrix();
    };

    controls.addEventListener('change', onObjectChange);

    return () => {
      controls.removeEventListener('change', onObjectChange);
      controls.detach();
      controls.dispose();
    };
  }, [scene, camera, domElement, object, mode]);

  return null;
};