import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useMemo, Suspense } from 'react';
import { GLTF } from 'three-stdlib';

interface CustomModelLoaderProps {
  modelUrl: string;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  selected?: boolean;
  fallbackComponent?: React.ReactNode;
  [key: string]: any;
}

function CustomModelContent({
  modelUrl,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color,
  selected = false,
  ...props
}: CustomModelLoaderProps) {
  const group = useRef<THREE.Group>(null);
  
  // Load the custom model
  const { scene } = useGLTF(modelUrl) as unknown as GLTF;

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

function FallbackModel({
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = '#a0a0a0',
  selected = false,
  ...props
}: Omit<CustomModelLoaderProps, 'modelUrl'>) {
  const group = useRef<THREE.Group>(null);

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
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {selected && (
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1, 32]} />
          <meshBasicMaterial color="#00ffff" side={THREE.DoubleSide} transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

export function CustomModelLoader({
  modelUrl,
  fallbackComponent,
  ...props
}: CustomModelLoaderProps) {
  // If no model URL is provided, show fallback
  if (!modelUrl) {
    return fallbackComponent ? (
      <>{fallbackComponent}</>
    ) : (
      <FallbackModel {...props} />
    );
  }

  return (
    <Suspense fallback={<FallbackModel {...props} />}>
      <CustomModelContent modelUrl={modelUrl} {...props} />
    </Suspense>
  );
}

// Preload function for custom models
export function preloadCustomModel(modelUrl: string) {
  if (modelUrl) {
    useGLTF.preload(modelUrl);
  }
}

export default CustomModelLoader;