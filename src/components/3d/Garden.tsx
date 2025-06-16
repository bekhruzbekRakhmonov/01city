'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box } from '@react-three/drei';
import * as THREE from 'three';

interface GardenProps {
  style: string;
  elements: string[];
  plotSize: {
    width: number;
    depth: number;
  };
}

export function Garden({ style, elements, plotSize }: GardenProps) {
  const gardenRef = useRef<THREE.Group>(null);
  
  // Generate positions for garden elements
  const generatePositions = () => {
    const positions: [number, number, number][] = [];
    const { width, depth } = plotSize;
    const margin = 1; // Margin from plot edge
    
    // Create a grid of possible positions
    const gridSize = Math.min(width, depth) / 2;
    const step = 2;
    
    for (let x = -width / 2 + margin; x <= width / 2 - margin; x += step) {
      for (let z = -depth / 2 + margin; z <= depth / 2 - margin; z += step) {
        // Skip positions too close to the center (where the main building is)
        if (Math.abs(x) < 3 && Math.abs(z) < 3) continue;
        
        positions.push([x, 0, z]);
      }
    }
    
    // Shuffle and take only the number we need
    return positions
      .sort(() => Math.random() - 0.5)
      .slice(0, elements.length);
  };
  
  const positions = generatePositions();
  
  // Simple animation for garden elements
  useFrame((state) => {
    if (gardenRef.current) {
      gardenRef.current.children.forEach((child, i) => {
        // Gentle swaying motion
        child.position.y = Math.sin(state.clock.elapsedTime * 0.5 + i * 0.5) * 0.1 + 0.5;
        child.rotation.set(
          child.rotation.x,
          Math.sin(state.clock.elapsedTime * 0.3 + i * 0.2) * 0.1,
          child.rotation.z
        );
      });
    }
  });
  
  // Render different garden elements based on style and elements array
  const renderGardenElements = () => {
    return elements.map((element, index) => {
      const position = positions[index] || [0, 0, 0];
      
      switch (element) {
        case 'tree':
          return (
            <group key={index} position={position}>
              {/* Tree trunk */}
              <Box args={[0.5, 1.5, 0.5]} position={[0, 0.75, 0]} castShadow>
                <meshStandardMaterial color="#8B4513" roughness={0.9} />
              </Box>
              {/* Tree foliage */}
              <Sphere args={[1.2, 8, 8]} position={[0, 2.2, 0]} castShadow>
                <meshStandardMaterial color="#228B22" roughness={0.8} />
              </Sphere>
            </group>
          );
          
        case 'bush':
          return (
            <group key={index} position={position}>
              <Sphere args={[0.8, 8, 8]} position={[0, 0.8, 0]} castShadow>
                <meshStandardMaterial color="#32CD32" roughness={0.7} />
              </Sphere>
            </group>
          );
          
        case 'flower':
          // Random flower color
          const flowerColors = ['#FF69B4', '#FF6347', '#FFD700', '#9370DB', '#00BFFF'];
          const flowerColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
          
          return (
            <group key={index} position={position}>
              {/* Stem */}
              <Box args={[0.1, 0.8, 0.1]} position={[0, 0.4, 0]} castShadow>
                <meshStandardMaterial color="#228B22" roughness={0.8} />
              </Box>
              {/* Flower */}
              <Sphere args={[0.3, 8, 8]} position={[0, 0.9, 0]} castShadow>
                <meshStandardMaterial color={flowerColor} roughness={0.6} />
              </Sphere>
            </group>
          );
          
        case 'rock':
          return (
            <group key={index} position={position}>
              <Sphere args={[0.5 + Math.random() * 0.3, 6, 6]} position={[0, 0.3, 0]} castShadow>
                <meshStandardMaterial color="#777777" roughness={0.9} />
              </Sphere>
            </group>
          );
          
        case 'pond':
          return (
            <group key={index} position={position}>
              <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.8, 16]} />
                <meshPhysicalMaterial 
                  color="#4169E1" 
                  metalness={0.1}
                  roughness={0.2}
                  transparent
                  opacity={0.8}
                  transmission={0.3}
                />
              </mesh>
              <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.8, 0.9, 16]} />
                <meshStandardMaterial color="#777777" />
              </mesh>
            </group>
          );
          
        case 'solarPanel':
          return (
            <group key={index} position={position}>
              {/* Base/stand */}
              <Box args={[0.1, 0.5, 0.1]} position={[0, 0.25, 0]} castShadow>
                <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.3} />
              </Box>
              
              {/* Panel */}
              <group position={[0, 0.7, 0]} rotation={[Math.PI / 6, 0, 0]}>
                <Box args={[1.2, 0.05, 0.8]} castShadow>
                  <meshStandardMaterial color="#111111" metalness={0.5} roughness={0.2} />
                </Box>
                
                {/* Panel grid */}
                <mesh position={[0, 0.03, 0]} rotation={[0, 0, 0]}>
                  <planeGeometry args={[1.1, 0.7]} />
                  <meshStandardMaterial 
                    color="#1E3A8A" 
                    metalness={0.8}
                    roughness={0.2}
                    emissive="#3B82F6"
                    emissiveIntensity={0.2}
                  />
                </mesh>
              </group>
            </group>
          );
          
        case 'sculpture':
          // Random modern sculpture design
          const sculptureType = Math.floor(Math.random() * 3);
          
          if (sculptureType === 0) {
            // Abstract vertical sculpture
            return (
              <group key={index} position={position}>
                <Box args={[0.2, 2, 0.2]} position={[0, 1, 0]} castShadow>
                  <meshStandardMaterial color="#DDDDDD" metalness={0.8} roughness={0.2} />
                </Box>
                <Sphere args={[0.4, 8, 8]} position={[0, 1.8, 0]} castShadow>
                  <meshStandardMaterial color="#FF5555" metalness={0.3} roughness={0.4} />
                </Sphere>
              </group>
            );
          } else if (sculptureType === 1) {
            // DNA-like spiral
            return (
              <group key={index} position={position}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <group key={i} position={[0, i * 0.25, 0]}>
                    <Sphere 
                      args={[0.15, 8, 8]} 
                      position={[
                        Math.sin(i * Math.PI / 4) * 0.3,
                        0,
                        Math.cos(i * Math.PI / 4) * 0.3
                      ]} 
                      castShadow
                    >
                      <meshStandardMaterial 
                        color={i % 2 === 0 ? "#3B82F6" : "#10B981"} 
                        metalness={0.5} 
                        roughness={0.3} 
                      />
                    </Sphere>
                  </group>
                ))}
              </group>
            );
          } else {
            // Infinity symbol
            return (
              <group key={index} position={position}>
                <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.5, 0.1, 16, 100, Math.PI * 2]} />
                  <meshStandardMaterial color="#DDDDDD" metalness={0.7} roughness={0.2} />
                </mesh>
              </group>
            );
          }
          
        default:
          return null;
      }
    });
  };
  
  return (
    <group ref={gardenRef}>
      {renderGardenElements()}
    </group>
  );
}