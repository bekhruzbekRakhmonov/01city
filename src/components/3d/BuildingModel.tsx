'use client';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { GLTF } from 'three-stdlib';

// Preload models
useGLTF.preload('/buildings3dmodel/low_poly_building.glb');
useGLTF.preload('/buildings3dmodel/sugarcube_corner.glb');

type BuildingType = 'low_poly' | 'sugarcube';

interface BuildingModelProps {
  modelType: BuildingType;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  selected?: boolean;
  [key: string]: any; // For additional props
}

export function BuildingModel({
  modelType,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color,
  selected = false,
  ...props
}: BuildingModelProps) {
  const group = useRef<THREE.Group>(null);
      const modelPath = `/buildings3dmodel/${modelType === 'low_poly' ? 'low_poly_building' : 'sugarcube_corner'}.glb`;
  const { scene } = useGLTF(modelPath) as unknown as GLTF;

  // Clone the scene to avoid sharing materials between instances
  const model = useMemo(() => {
    const modelClone = scene.clone();
    
    // Apply color if provided
    if (color) {
      modelClone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = child.material.clone();
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.setStyle(color);
          }
        }
      });
    }

    return modelClone;
  }, [scene, color]);

  // Add hover/selection effect
  useFrame(() => {
    if (group.current) {
      if (selected) {
        group.current.scale.setScalar(scale * 1.05);
      } else {
        group.current.scale.setScalar(scale);
      }
    }
  });

  return (
    <group ref={group} position={position} rotation={rotation} {...props}>
      <primitive object={model} scale={scale} />
      {selected && (
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1, 32]} />
          <meshBasicMaterial color="#00ffff" side={THREE.DoubleSide} transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}


