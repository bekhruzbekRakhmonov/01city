'use client';

import * as THREE from 'three';
import { useRef } from 'react';
import { ExtrudeGeometry, Shape } from 'three';

// Helper to create a triangular prism shape for the pediment and roof
const createTriangularPrism = (width: number, height: number, depth: number) => {
  const shape = new THREE.Shape();
  const halfWidth = width / 2;
  shape.moveTo(-halfWidth, 0);
  shape.lineTo(halfWidth, 0);
  shape.lineTo(0, height);
  shape.lineTo(-halfWidth, 0);
  const extrudeSettings = { depth, bevelEnabled: false };
  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
};

interface GovernmentBuildingProps {
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  stoneColor?: THREE.ColorRepresentation;
  roofColor?: THREE.ColorRepresentation;
  domeColor?: THREE.ColorRepresentation;
  columnColor?: THREE.ColorRepresentation;
  windowColor?: THREE.ColorRepresentation;
  doorColor?: THREE.ColorRepresentation;
  onBuildingClick?: () => void;
}

export function GovernmentBuilding({
  scale = 2,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  stoneColor = '#dcdcdc', // Lighter, more classic stone
  roofColor = '#5a6d7c', // Slate gray roof
  domeColor = '#607d8b', // Blue-gray dome
  columnColor = '#ffffff',
  windowColor = '#2c3e50', // Dark blue-gray for glass
  doorColor = '#6a4a3a', // Dark wood color
  onBuildingClick,
}: GovernmentBuildingProps) {
  const group = useRef<THREE.Group>(null);

  // Create complex geometries once
  const pedimentGeometry = createTriangularPrism(34, 5, 1.9);
  const mainRoofGeometry = createTriangularPrism(40, 6, 26);

  const handleClick = (event: any) => {
    event.stopPropagation();
    if (onBuildingClick) {
      onBuildingClick();
    }
  };

  return (
    <group 
      ref={group} 
      position={position} 
      rotation={rotation} 
      scale={[scale, scale, scale]}
      onClick={handleClick}
    >
      {/* ================================================================== */}
      {/* FOUNDATION & STEPS */}
      {/* ================================================================== */}
      {/* Main Foundation */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[42, 2, 28]} />
        <meshStandardMaterial color={stoneColor} roughness={0.8} />
      </mesh>

      {/* Grand Staircase */}
      {[...Array(5)].map((_, i) => (
        <mesh
          key={`step-${i}`}
          position={[0, 0.2 + i * 0.2, 15 + i * 0.8]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[36 - i * 1.5, 0.2, 0.8]} />
          <meshStandardMaterial color={stoneColor} roughness={0.8} />
        </mesh>
      ))}

      {/* ================================================================== */}
      {/* MAIN STRUCTURE */}
      {/* ================================================================== */}
      {/* Main Building Body - Central Block */}
      <mesh position={[0, 8, -1]} castShadow receiveShadow>
        <boxGeometry args={[32, 12, 24]} />
        <meshStandardMaterial color={stoneColor} roughness={0.7} />
      </mesh>
      {/* Main Building Body - Wings */}
      <mesh position={[-18, 7, -1]} castShadow receiveShadow>
        <boxGeometry args={[4, 10, 24]} />
        <meshStandardMaterial color={stoneColor} roughness={0.7} />
      </mesh>
      <mesh position={[18, 7, -1]} castShadow receiveShadow>
        <boxGeometry args={[4, 10, 24]} />
        <meshStandardMaterial color={stoneColor} roughness={0.7} />
      </mesh>

      {/* ================================================================== */}
      {/* PORTICO & COLUMNS */}
      {/* ================================================================== */}
      {/* Portico base (Stylobate) */}
      <mesh position={[0, 2.25, 12]} castShadow receiveShadow>
        <boxGeometry args={[34, 0.5, 4]} />
        <meshStandardMaterial color={stoneColor} roughness={0.7} />
      </mesh>

      {/* Front Columns (8 columns for a grander look) */}
      {[-15, -10, -5, 0, 0, 5, 10, 15].map((x, i) => (
        <group key={`front-column-${i}`} position={[x, 0, 12]}>
          {/* Column base */}
          <mesh position={[0, 2.7, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1, 1, 0.4, 32]} />
            <meshStandardMaterial color={columnColor} roughness={0.5} />
          </mesh>
          {/* Column shaft */}
          <mesh position={[0, 8.1, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.8, 0.9, 10, 32]} />
            <meshStandardMaterial color={columnColor} roughness={0.5} />
          </mesh>
          {/* Column capital (Echinus & Abacus) */}
          <mesh position={[0, 13.3, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1, 0.8, 0.4, 32]} />
            <meshStandardMaterial color={columnColor} roughness={0.5} />
          </mesh>
          <mesh position={[0, 13.7, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.2, 0.4, 2.2]} />
            <meshStandardMaterial color={columnColor} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* ================================================================== */}
      {/* ROOF & DOME */}
      {/* ================================================================== */}
      {/* Pediment (Triangular part) */}
      <mesh position={[0, 14, 11]} castShadow receiveShadow geometry={pedimentGeometry}>
        <meshStandardMaterial color={stoneColor} roughness={0.9} />
      </mesh>
      

      {/* Central Tower Base (Drum for the Dome) */}
      <mesh position={[0, 16, -1]} castShadow receiveShadow>
        <cylinderGeometry args={[7, 7, 5, 32]} />
        <meshStandardMaterial color={stoneColor} roughness={0.7} />
      </mesh>
      
      {/* Dome */}
      <mesh position={[0, 18, -1]} castShadow receiveShadow>
        <sphereGeometry args={[6.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={domeColor} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Lantern (structure on top of the dome) */}
      <mesh position={[0, 24.5, -1]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1.2, 1, 16]} />
        <meshStandardMaterial color={stoneColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, 25, -1]} castShadow receiveShadow>
        <sphereGeometry args={[1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={domeColor} roughness={0.4} />
      </mesh>
      {/* Spire */}
      <mesh position={[0, 26, -1]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.05, 2]} />
        <meshStandardMaterial color={domeColor} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* ================================================================== */}
      {/* DOORS & WINDOWS */}
      {/* ================================================================== */}
      {/* Main Entrance (Arched Door) */}
      <group position={[0, 5, 11.1]}>
        {/* Door Panels */}
        <mesh position={[-0.8, 1.5, 0]} castShadow>
          <boxGeometry args={[1.5, 3, 0.2]} />
          <meshStandardMaterial color={doorColor} roughness={0.6} />
        </mesh>
        <mesh position={[0.8, 1.5, 0]} castShadow>
          <boxGeometry args={[1.5, 3, 0.2]} />
          <meshStandardMaterial color={doorColor} roughness={0.6} />
        </mesh>
        {/* Arch */}
        <mesh position={[0, 3, 0]} castShadow>
          <cylinderGeometry args={[1.6, 1.6, 0.2, 32, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color={doorColor} roughness={0.6} />
        </mesh>
        {/* Frame */}
        <mesh position={[0, 1.6, -0.05]} castShadow>
          <boxGeometry args={[3.6, 3.2, 0.1]} />
          <meshStandardMaterial color={stoneColor} roughness={0.7} />
        </mesh>
      </group>

      {/* Front Windows */}
      {[-12, -8, -4, 4, 8, 12].map((x) => (
         <group key={`front-window-${x}`} position={[x, 8, 11.1]}>
           <mesh castShadow>
             <boxGeometry args={[2, 3, 0.2]} />
             <meshStandardMaterial color={windowColor} roughness={0.1} metalness={0.2} />
           </mesh>
           <mesh position={[0, 0, -0.05]} castShadow>
             <boxGeometry args={[2.4, 3.4, 0.1]} />
             <meshStandardMaterial color={stoneColor} roughness={0.7} />
           </mesh>
         </group>
      ))}
    </group>
  );
}