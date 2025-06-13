import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingModel } from './BuildingModel';

// Define building types that match our 3D models
export type BuildingType = 'low_poly' | 'sugarcube' | 'custom';

// Define building presets
const BUILDING_PRESETS = {
  low_poly: {
    scale: 0.5,
    height: 1.5,
    baseColor: '#cccccc',
  },
  sugarcube: {
    scale: 0.2,
    height: 1.2,
    baseColor: '#e0e0e0',
  },
  custom: {
    scale: 0.3,
    height: 1,
    baseColor: '#a0a0a0',
  },
};

interface BuildingProps {
  type?: BuildingType;
  position?: [number, number, number];
  height?: number;
  color?: string;
  rotation?: [number, number, number];
  scale?: number;
  selected?: boolean;
  customizations?: Record<string, unknown>;
}

/**
 * Building component that renders either a custom box or a 3D model building
 * Supports selection highlighting and hover animations
 */
function Building({ 
  type = 'low_poly', 
  position = [0, 0, 0], 
  height,
  color,
  rotation = [0, 0, 0],
  scale: customScale,
  selected = false,
  customizations = {}
}: BuildingProps) {
  const buildingRef = useRef<THREE.Group>(null);
  const preset = BUILDING_PRESETS[type as keyof typeof BUILDING_PRESETS] || BUILDING_PRESETS.low_poly;
  
  // Use provided values or fall back to presets
  const buildingHeight = height ?? preset.height;
  const buildingColor = color ?? preset.baseColor;
  const scale = customScale ?? preset.scale;

  // Add subtle animation for hover effect
  useFrame((state) => {
    if (!buildingRef.current) return;
    
    if (selected) {
      // Add subtle hover effect when selected
      buildingRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 2) * 0.05;
    } else {
      buildingRef.current.position.y = position[1];
    }
  });

  // For custom buildings, fall back to a simple box
  if (type === 'custom') {
    return (
      <group ref={buildingRef} position={position} rotation={rotation}>
        <Box args={[1, buildingHeight, 1]}>
          <meshStandardMaterial color={buildingColor} />
        </Box>
      </group>
    );
  }

  // For 3D model buildings
  return (
    <BuildingModel 
      modelType={type as 'low_poly' | 'sugarcube'}
      position={position}
      rotation={rotation}
      scale={scale}
      color={buildingColor}
      selected={selected}
      {...customizations}
    />
  );
}

export { Building };
export default Building;
