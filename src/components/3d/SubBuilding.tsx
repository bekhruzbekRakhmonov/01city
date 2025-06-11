'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, RoundedBox, Cylinder, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface SubBuildingProps {
  type: string;
  position: [number, number, number];
  rotation: number;
  size: number;
  color: string;
  customizations?: any;
}

export function SubBuilding({ type, position, rotation, size, color, customizations }: SubBuildingProps) {
  const buildingRef = useRef<THREE.Group>(null);
  
  // Create texture maps for buildings
  const textureProps = useMemo(() => {
    // Create procedural textures
    const textureSize = 512;
    const canvas = document.createElement('canvas');
    canvas.width = textureSize;
    canvas.height = textureSize;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Base color
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, textureSize, textureSize);
      
      // Add texture pattern based on building type
      if (type === 'cafe') {
        // Storefront pattern
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        
        // Horizontal lines for storefront
        for (let y = 0; y < textureSize; y += textureSize / 8) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(textureSize, y);
          ctx.stroke();
        }
      } else if (type === 'fountain' || type === 'gazebo') {
        // Stone texture pattern
        const stoneSize = textureSize / 12;
        
        for (let y = 0; y < textureSize; y += stoneSize) {
          for (let x = 0; x < textureSize; x += stoneSize) {
            const offset = (y % (stoneSize * 2)) === 0 ? 0 : stoneSize / 2;
            
            ctx.fillStyle = '#' + Math.floor(parseInt(color.slice(1), 16) * (0.9 + Math.random() * 0.2)).toString(16).padStart(6, '0');
            ctx.fillRect(x + offset, y, stoneSize - 1, stoneSize - 1);
            
            ctx.strokeStyle = '#555555';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x + offset, y, stoneSize - 1, stoneSize - 1);
          }
        }
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    
    return { map: texture };
  }, [color, type]);
  
  // Subtle animation for hover effect
  useFrame((state) => {
    if (buildingRef.current) {
      buildingRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
    }
  });
  
  // Sub-building types
  const subBuildingTypes = ['cafe', 'studio', 'gallery', 'gazebo', 'fountain', 'techLounge', 'bikeStation', 'innovationLab'];
  
  // Determine building dimensions based on type and size
  const getBuildingDimensions = () => {
    const baseSize = size || 1;
    
    switch (type) {
      case 'cafe':
        return { width: baseSize * 3, depth: baseSize * 3, height: baseSize * 2 };
      case 'studio':
        return { width: baseSize * 4, depth: baseSize * 3, height: baseSize * 2.5 };
      case 'gallery':
        return { width: baseSize * 5, depth: baseSize * 4, height: baseSize * 2 };
      case 'gazebo':
        return { width: baseSize * 2.5, depth: baseSize * 2.5, height: baseSize * 2.5 };
      case 'fountain':
        return { width: baseSize * 3, depth: baseSize * 3, height: baseSize * 1.5 };
      case 'techLounge':
        return { width: baseSize * 4, depth: baseSize * 4, height: baseSize * 1.8 };
      case 'bikeStation':
        return { width: baseSize * 3.5, depth: baseSize * 2, height: baseSize * 1.5 };
      case 'innovationLab':
        return { width: baseSize * 4, depth: baseSize * 4, height: baseSize * 2.2 };
      default:
        return { width: baseSize * 3, depth: baseSize * 3, height: baseSize * 2 };
    }
  };
  
  const dimensions = getBuildingDimensions();
  
  // Render different sub-building types
  const renderSubBuilding = () => {
    switch (type) {
      case 'techLounge':
        return (
          <group>
            {/* Main lounge structure - modern glass pod */}
            <RoundedBox 
              args={[dimensions.width, dimensions.height, dimensions.depth]} 
              radius={0.5}
              smoothness={6}
              castShadow
            >
              <meshPhysicalMaterial 
                color={color}
                metalness={0.3} 
                roughness={0.1} 
                clearcoat={1}
                transmission={0.1}
                transparent
                opacity={0.95}
              />
            </RoundedBox>
            
            {/* Lounge furniture */}
            <Box 
              args={[dimensions.width * 0.6, dimensions.height * 0.1, dimensions.depth * 0.6]} 
              position={[0, -dimensions.height * 0.3, 0]}
            >
              <meshStandardMaterial color="#DDDDDD" />
            </Box>
            
            {/* Tech elements - screens */}
            <Box 
              args={[dimensions.width * 0.7, dimensions.height * 0.4, 0.1]} 
              position={[0, 0, dimensions.depth / 2 - 0.1]}
            >
              <meshStandardMaterial 
                color="#111111" 
                emissive="#3366FF"
                emissiveIntensity={0.5}
              />
            </Box>
            
            {/* Ambient lighting */}
            <Box 
              args={[dimensions.width * 0.8, 0.05, dimensions.depth * 0.8]} 
              position={[0, dimensions.height / 2 - 0.1, 0]}
            >
              <meshStandardMaterial 
                color="#FFFFFF" 
                emissive="#FFFFFF"
                emissiveIntensity={0.8}
              />
            </Box>
          </group>
        );
        
      case 'bikeStation':
        return (
          <group>
            {/* Main station structure */}
            <Box 
              args={[dimensions.width, dimensions.height * 0.7, dimensions.depth]} 
              position={[0, -dimensions.height * 0.15, 0]}
              castShadow
            >
              <meshStandardMaterial color={color} />
            </Box>
            
            {/* Roof - solar panels */}
            <Box 
              args={[dimensions.width * 1.2, dimensions.height * 0.1, dimensions.depth * 1.2]} 
              position={[0, dimensions.height * 0.3, 0]}
              castShadow
            >
              <meshStandardMaterial color="#1E1E1E" />
            </Box>
            
            {/* Bike racks */}
            {Array.from({ length: 5 }).map((_, i) => (
              <group key={i} position={[(i - 2) * 0.7, -dimensions.height * 0.3, 0]}>
                {/* Bike stand */}
                <Box 
                  args={[0.1, 0.5, 0.1]} 
                  position={[0, 0.25, 0]}
                >
                  <meshStandardMaterial color="#555555" />
                </Box>
                {/* Bike wheel representation */}
                <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.2, 0.25, 16]} />
                  <meshStandardMaterial color="#333333" />
                </mesh>
              </group>
            ))}
            
            {/* Station sign */}
            <Box 
              args={[dimensions.width * 0.6, dimensions.height * 0.2, 0.1]} 
              position={[0, dimensions.height * 0.4, dimensions.depth / 2 + 0.1]}
            >
              <meshStandardMaterial 
                color="#4CAF50" 
                emissive="#4CAF50"
                emissiveIntensity={0.3}
              />
            </Box>
          </group>
        );
        
      case 'innovationLab':
        return (
          <group>
            {/* Main lab structure - futuristic design */}
            <RoundedBox 
              args={[dimensions.width, dimensions.height, dimensions.depth]} 
              radius={0.3}
              smoothness={4}
              castShadow
            >
              <meshPhysicalMaterial 
                color={color}
                metalness={0.5} 
                roughness={0.2} 
              />
            </RoundedBox>
            
            {/* Glass dome on top */}
            <mesh position={[0, dimensions.height / 2 + 0.5, 0]}>
              <sphereGeometry args={[dimensions.width * 0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshPhysicalMaterial 
                color="#AACCFF" 
                metalness={0.1}
                roughness={0.05}
                transmission={0.9} 
                transparent
                opacity={0.7}
              />
            </mesh>
            
            {/* Lab windows with internal lighting */}
            {Array.from({ length: 2 }).map((_, i) => (
              <Box 
                key={i}
                args={[dimensions.width * 0.5, dimensions.height * 0.3, 0.1]} 
                position={[0, (i - 0.5) * 1, dimensions.depth / 2 + 0.05]}
              >
                <meshPhysicalMaterial 
                  color="#FFFFFF" 
                  emissive={Math.random() > 0.5 ? "#00FFFF" : "#FF00FF"}
                  emissiveIntensity={0.3}
                  transmission={0.5} 
                  transparent
                  opacity={0.9}
                />
              </Box>
            ))}
            
            {/* Antenna/satellite dish */}
            <group position={[dimensions.width * 0.3, dimensions.height / 2 + 0.2, dimensions.depth * 0.3]}>
              <Box args={[0.1, 0.8, 0.1]} position={[0, 0.4, 0]}>
                <meshStandardMaterial color="#555555" />
              </Box>
              <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 4, 0, 0]}>
                <circleGeometry args={[0.3, 16]} />
                <meshStandardMaterial color="#AAAAAA" side={THREE.DoubleSide} />
              </mesh>
            </group>
          </group>
        );
        
      case 'cafe':
        return (
          <group ref={buildingRef} rotation={[0, rotation * Math.PI / 180, 0]}>
            {/* Main cafe body with texture */}
            <Box args={[dimensions.width, dimensions.height, dimensions.depth]} castShadow>
              <meshStandardMaterial 
                {...textureProps}
                roughness={0.6} 
                metalness={0.1}
              />
            </Box>
            
            {/* Cafe awning with fabric texture */}
            <Box 
              args={[dimensions.width * 1.2, dimensions.height * 0.1, dimensions.depth * 0.6]} 
              position={[0, dimensions.height * 0.1, dimensions.depth * 0.4]}
              castShadow
            >
              <meshStandardMaterial 
                color={customizations?.awningColor || '#FF5555'} 
                roughness={0.9}
                metalness={0}
              />
            </Box>
            
            {/* Cafe windows with realistic glass */}
            <Box 
              args={[dimensions.width * 0.7, dimensions.height * 0.5, 0.1]} 
              position={[0, 0, dimensions.depth / 2 + 0.05]}
            >
              <meshPhysicalMaterial 
                color="#88ccff" 
                transparent 
                opacity={0.8} 
                metalness={0.1} 
                roughness={0.1}
                transmission={0.6}
                reflectivity={0.7}
              />
            </Box>
            
            {/* Cafe sign */}
            <Box
              args={[dimensions.width * 0.6, dimensions.height * 0.2, 0.1]}
              position={[0, dimensions.height * 0.4, dimensions.depth / 2 + 0.1]}
            >
              <meshStandardMaterial 
                color="#222222"
                emissive="#FFCC00"
                emissiveIntensity={0.5}
              />
            </Box>
            
            {/* Outdoor seating area with tables and chairs */}
            {/* Table 1 with tablecloth */}
            <Box 
              args={[dimensions.width * 0.25, dimensions.height * 0.02, dimensions.width * 0.25]} 
              position={[-dimensions.width * 0.3, -dimensions.height * 0.3, dimensions.depth * 0.7]}
            >
              <meshStandardMaterial color="#FFFFFF" />
            </Box>
            <Cylinder
              args={[0.1, 0.1, dimensions.height * 0.3, 8]}
              position={[-dimensions.width * 0.3, -dimensions.height * 0.45, dimensions.depth * 0.7]}
            >
              <meshStandardMaterial color="#555555" metalness={0.5} />
            </Cylinder>
            
            {/* Chair 1 */}
            <Box
              args={[dimensions.width * 0.12, dimensions.height * 0.12, dimensions.width * 0.12]}
              position={[-dimensions.width * 0.3, -dimensions.height * 0.24, dimensions.depth * 0.9]}
            >
              <meshStandardMaterial color="#333333" />
            </Box>
            
            {/* Table 2 with tablecloth */}
            <Box 
              args={[dimensions.width * 0.25, dimensions.height * 0.02, dimensions.width * 0.25]} 
              position={[dimensions.width * 0.3, -dimensions.height * 0.3, dimensions.depth * 0.7]}
            >
              <meshStandardMaterial color="#FFFFFF" />
            </Box>
            <Cylinder
              args={[0.1, 0.1, dimensions.height * 0.3, 8]}
              position={[dimensions.width * 0.3, -dimensions.height * 0.45, dimensions.depth * 0.7]}
            >
              <meshStandardMaterial color="#555555" metalness={0.5} />
            </Cylinder>
            
            {/* Chair 2 */}
            <Box
              args={[dimensions.width * 0.12, dimensions.height * 0.12, dimensions.width * 0.12]}
              position={[dimensions.width * 0.3, -dimensions.height * 0.24, dimensions.depth * 0.9]}
            >
              <meshStandardMaterial color="#333333" />
            </Box>
          </group>
        );
      
      case 'studio':
        return (
          <group>
            {/* Main studio body */}
            <RoundedBox 
              args={[dimensions.width, dimensions.height, dimensions.depth]} 
              radius={0.2}
              smoothness={4}
              castShadow
            >
              <meshStandardMaterial color={color} roughness={0.5} />
            </RoundedBox>
            
            {/* Studio windows */}
            <Box 
              args={[dimensions.width * 0.8, dimensions.height * 0.6, 0.1]} 
              position={[0, 0, dimensions.depth / 2 + 0.05]}
            >
              <meshStandardMaterial 
                color="#88ccff" 
                transparent 
                opacity={0.8} 
                metalness={0.4} 
                roughness={0.2} 
              />
            </Box>
            
            {/* Studio roof feature */}
            <Box 
              args={[dimensions.width * 0.5, dimensions.height * 0.2, dimensions.depth * 0.5]} 
              position={[0, dimensions.height / 2 + dimensions.height * 0.1, 0]}
              castShadow
            >
              <meshStandardMaterial color={customizations?.roofColor || '#444444'} metalness={0.5} roughness={0.5} />
            </Box>
          </group>
        );
      
      case 'gallery':
        return (
          <group>
            {/* Main gallery body */}
            <Box args={[dimensions.width, dimensions.height, dimensions.depth]} castShadow>
              <meshStandardMaterial color={color} roughness={0.4} />
            </Box>
            
            {/* Gallery entrance */}
            <Box 
              args={[dimensions.width * 0.3, dimensions.height * 0.6, dimensions.depth * 0.1]} 
              position={[0, -dimensions.height * 0.2, dimensions.depth / 2 + 0.05]}
            >
              <meshStandardMaterial color="#333333" />
            </Box>
            
            {/* Gallery sign */}
            <Box 
              args={[dimensions.width * 0.7, dimensions.height * 0.15, 0.1]} 
              position={[0, dimensions.height * 0.3, dimensions.depth / 2 + 0.1]}
            >
              <meshStandardMaterial color={customizations?.signColor || '#FFFFFF'} />
            </Box>
            
            {/* Gallery columns */}
            <Box 
              args={[dimensions.width * 0.1, dimensions.height, dimensions.width * 0.1]} 
              position={[-dimensions.width / 2 + dimensions.width * 0.1, 0, dimensions.depth / 2 - dimensions.width * 0.1]}
            >
              <meshStandardMaterial color="#DDDDDD" />
            </Box>
            <Box 
              args={[dimensions.width * 0.1, dimensions.height, dimensions.width * 0.1]} 
              position={[dimensions.width / 2 - dimensions.width * 0.1, 0, dimensions.depth / 2 - dimensions.width * 0.1]}
            >
              <meshStandardMaterial color="#DDDDDD" />
            </Box>
          </group>
        );
      
      case 'gazebo':
        return (
          <group>
            {/* Gazebo base */}
            <Box 
              args={[dimensions.width, dimensions.height * 0.1, dimensions.depth]} 
              position={[0, -dimensions.height * 0.45, 0]}
              castShadow
            >
              <meshStandardMaterial color="#8B4513" roughness={0.8} />
            </Box>
            
            {/* Gazebo columns */}
            {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map((pos, i) => (
              <Box 
                key={i}
                args={[dimensions.width * 0.1, dimensions.height * 0.8, dimensions.width * 0.1]} 
                position={[
                  pos[0] * (dimensions.width / 2 - dimensions.width * 0.1), 
                  -dimensions.height * 0.05, 
                  pos[1] * (dimensions.depth / 2 - dimensions.width * 0.1)
                ]}
                castShadow
              >
                <meshStandardMaterial color="#8B4513" roughness={0.8} />
              </Box>
            ))}
            
            {/* Gazebo roof */}
            <mesh 
              position={[0, dimensions.height * 0.4, 0]} 
              castShadow
            >
              <coneGeometry args={[dimensions.width * 0.8, dimensions.height * 0.5, 4]} />
              <meshStandardMaterial color={customizations?.roofColor || '#A52A2A'} roughness={0.7} />
            </mesh>
          </group>
        );
      
      case 'fountain':
        return (
          <group>
            {/* Fountain base */}
            <RoundedBox 
              args={[dimensions.width, dimensions.height * 0.3, dimensions.depth]} 
              radius={0.1}
              smoothness={4}
              position={[0, -dimensions.height * 0.35, 0]}
              castShadow
            >
              <meshStandardMaterial color="#CCCCCC" roughness={0.7} />
            </RoundedBox>
            
            {/* Fountain water */}
            <mesh 
              position={[0, -dimensions.height * 0.2, 0]} 
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <circleGeometry args={[dimensions.width * 0.4, 32]} />
              <meshStandardMaterial 
                color="#4169E1" 
                metalness={0.3}
                roughness={0.1}
                transparent
                opacity={0.8}
              />
            </mesh>
            
            {/* Fountain center piece */}
            <mesh 
              position={[0, -dimensions.height * 0.1, 0]} 
              castShadow
            >
              <cylinderGeometry args={[dimensions.width * 0.1, dimensions.width * 0.15, dimensions.height * 0.3, 16]} />
              <meshStandardMaterial color="#CCCCCC" roughness={0.7} />
            </mesh>
            
            {/* Fountain top */}
            <Sphere 
              args={[dimensions.width * 0.15, 16, 16]} 
              position={[0, dimensions.height * 0.1, 0]}
              castShadow
            >
              <meshStandardMaterial color="#CCCCCC" roughness={0.7} />
            </Sphere>
          </group>
        );
      
      default:
        // Default simple sub-building
        return (
          <Box args={[dimensions.width, dimensions.height, dimensions.depth]} castShadow>
            <meshStandardMaterial color={color} />
          </Box>
        );
    }
  };
  
  return (
    <group 
      ref={buildingRef} 
      position={[position[0], position[1] + dimensions.height / 2, position[2]]}
      rotation={[0, rotation, 0]}
    >
      {renderSubBuilding()}
    </group>
  );
}