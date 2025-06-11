import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, RoundedBox, useTexture, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

interface BuildingProps {
  type: string;
  position: [number, number, number];
  height: number;
  color: string;
  rotation: number;
  customizations?: any;
}

function Building({ type, position, height, color, rotation, customizations }: BuildingProps) {
  const buildingRef = useRef<THREE.Group>(null);
  
  // Create texture maps for buildings
  const textureProps = useMemo(() => {
    // In a real implementation, these would be actual texture files
    // For now, we'll create procedural textures
    const textureSize = 512;
    const canvas = document.createElement('canvas');
    canvas.width = textureSize;
    canvas.height = textureSize;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Base color
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, textureSize, textureSize);
      
      // Add some texture/pattern based on building type
      if (type === 'skyscraper') {
        // Grid pattern for skyscraper windows
        const gridSize = textureSize / 10;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        for (let i = 0; i <= textureSize; i += gridSize) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, textureSize);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(textureSize, i);
          ctx.stroke();
        }
      } else if (type === 'house') {
        // Brick pattern for houses
        const brickWidth = textureSize / 15;
        const brickHeight = textureSize / 30;
        
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1;
        
        for (let y = 0; y < textureSize; y += brickHeight) {
          const offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);
          
          for (let x = -brickWidth/2; x < textureSize; x += brickWidth) {
            ctx.fillStyle = '#' + Math.floor(parseInt(color.slice(1), 16) * 0.9).toString(16).padStart(6, '0');
            ctx.fillRect(x + offset, y, brickWidth - 1, brickHeight - 1);
          }
        }
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, height / 5);
    
    return { map: texture };
  }, [color, type, height]);
  
  // More subtle animation for hover effect
  useFrame((state) => {
    if (buildingRef.current) {
      buildingRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
    }
  });
  
  // Building types
  const buildingTypes = ['house', 'skyscraper', 'shop', 'tower', 'techCampus', 'startupOffice', 'dataCenter'];
  
  // Determine building dimensions based on type
  const getBuildingDimensions = () => {
    switch (type) {
      case 'skyscraper':
        return { width: 4, depth: 4, height };
      case 'house':
        return { width: 6, depth: 6, height };
      case 'shop':
        return { width: 5, depth: 7, height };
      case 'tower':
        return { width: 3, depth: 3, height };
      case 'techCampus':
        return { width: 8, depth: 8, height: Math.min(height, 4) }; // Tech campuses are typically wider and lower
      case 'startupOffice':
        return { width: 5, depth: 6, height };
      case 'dataCenter':
        return { width: 7, depth: 9, height };
      default:
        return { width: 5, depth: 5, height };
    }
  };
  
  const dimensions = getBuildingDimensions();
  
  // Render different building types
  const renderBuilding = () => {
    switch (type) {
      case 'techCampus':
        return (
          <group ref={buildingRef}>
            {/* Main campus building - circular design inspired by Apple Park */}
            <RoundedBox 
              args={[dimensions.width, dimensions.height, dimensions.depth]} 
              radius={dimensions.width / 4}
              smoothness={6}
              castShadow
            >
              <meshPhysicalMaterial 
                color={color}
                metalness={0.2} 
                roughness={0.1} 
                clearcoat={1}
                clearcoatRoughness={0.1}
                reflectivity={1}
              />
            </RoundedBox>
            
            {/* Glass panels all around */}
            {Array.from({ length: 8 }).map((_, i) => (
              <mesh 
                key={i} 
                position={[
                  Math.sin(i * Math.PI / 4) * (dimensions.width / 2 - 0.1),
                  0,
                  Math.cos(i * Math.PI / 4) * (dimensions.depth / 2 - 0.1)
                ]}
                rotation={[0, i * Math.PI / 4, 0]}
              >
                <planeGeometry args={[dimensions.width / 2, dimensions.height * 0.7]} />
                <meshPhysicalMaterial 
                  color="#FFFFFF" 
                  metalness={0.3}
                  roughness={0.05}
                  transmission={0.9} 
                  transparent
                  opacity={0.8}
                  reflectivity={1}
                />
              </mesh>
            ))}
            
            {/* Solar panels on roof */}
            <group position={[0, dimensions.height / 2 + 0.05, 0]}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Box 
                  key={i}
                  args={[dimensions.width * 0.15, 0.1, dimensions.depth * 0.3]} 
                  position={[
                    (i % 2 === 0 ? 1 : -1) * dimensions.width * 0.25,
                    0,
                    (i < 2 ? 1 : -1) * dimensions.depth * 0.25
                  ]}
                >
                  <meshStandardMaterial color="#1E1E1E" />
                </Box>
              ))}
            </group>
          </group>
        );
        
      case 'startupOffice':
        return (
          <group ref={buildingRef}>
            {/* Main building - modern glass design */}
            <RoundedBox 
              args={[dimensions.width, dimensions.height, dimensions.depth]} 
              radius={0.2}
              smoothness={4}
              castShadow
            >
              <meshPhysicalMaterial 
                color={color}
                metalness={0.4} 
                roughness={0.2} 
                clearcoat={0.5}
              />
            </RoundedBox>
            
            {/* Large windows with company logo */}
            <mesh position={[0, 0, dimensions.depth / 2 + 0.01]} rotation={[0, 0, 0]}>
              <planeGeometry args={[dimensions.width - 1, dimensions.height - 2]} />
              <meshPhysicalMaterial 
                color="#88ccff" 
                metalness={0.9}
                roughness={0.05}
                transmission={0.5} 
                transparent
                opacity={0.9}
                reflectivity={0.9}
              />
            </mesh>
            
            {/* Company logo/sign */}
            <Box 
              args={[dimensions.width * 0.4, dimensions.height * 0.15, 0.1]} 
              position={[0, dimensions.height * 0.3, dimensions.depth / 2 + 0.15]}
            >
              <meshStandardMaterial 
                color={customizations?.logoColor || "#FFFFFF"} 
                emissive={customizations?.logoColor || "#FFFFFF"}
                emissiveIntensity={0.5}
              />
            </Box>
            
            {/* Roof garden/terrace */}
            <Box 
              args={[dimensions.width * 0.7, 0.2, dimensions.depth * 0.7]} 
              position={[0, dimensions.height / 2 + 0.1, 0]}
            >
              <meshStandardMaterial color="#4CAF50" />
            </Box>
          </group>
        );
        
      case 'dataCenter':
        return (
          <group ref={buildingRef}>
            {/* Main data center building - utilitarian design */}
            <Box 
              args={[dimensions.width, dimensions.height, dimensions.depth]} 
              castShadow
            >
              <meshStandardMaterial 
                color={color} 
                roughness={0.7}
              />
            </Box>
            
            {/* Cooling units on roof */}
            {Array.from({ length: 6 }).map((_, i) => (
              <Box 
                key={i}
                args={[1, 1, 1]} 
                position={[
                  ((i % 3) - 1) * 2,
                  dimensions.height / 2 + 0.5,
                  (i < 3 ? -1 : 1) * 2
                ]}
                castShadow
              >
                <meshStandardMaterial color="#AAAAAA" />
              </Box>
            ))}
            
            {/* Server rack indicators - blinking lights */}
            {Array.from({ length: Math.floor(dimensions.height / 1.5) }).map((_, i) => (
              <Box 
                key={i}
                args={[dimensions.width - 0.5, 0.2, 0.1]} 
                position={[0, i * 1.5 - dimensions.height / 2 + 1, dimensions.depth / 2 + 0.06]}
              >
                <meshStandardMaterial 
                  color="#222222" 
                  emissive={Math.random() > 0.7 ? "#00FF00" : "#FF0000"}
                  emissiveIntensity={0.8}
                />
              </Box>
            ))}
            
            {/* Security features */}
            <Box 
              args={[1, 2, 0.1]} 
              position={[0, -dimensions.height / 2 + 1, dimensions.depth / 2 + 0.06]}
            >
              <meshStandardMaterial color="#333333" />
            </Box>
          </group>
        );
        
      case 'skyscraper':
        return (
          <group ref={buildingRef}>
            {/* Main building structure */}
            <RoundedBox 
              args={[dimensions.width, dimensions.height, dimensions.depth]} 
              radius={0.1}
              smoothness={4}
              castShadow
            >
              <meshStandardMaterial 
                {...textureProps}
                metalness={0.7} 
                roughness={0.2} 
                envMapIntensity={1.5}
              />
            </RoundedBox>
            
            {/* Detailed windows with realistic glass effect */}
            {Array.from({ length: Math.floor(dimensions.height / 1.5) }).map((_, i) => (
              <group key={i} position={[0, i * 1.5 - dimensions.height / 2 + 1.5, 0]}>
                {/* Front windows - now with more realistic glass */}
                <mesh position={[0, 0, dimensions.depth / 2 + 0.01]} rotation={[0, 0, 0]}>
                  <planeGeometry args={[dimensions.width - 0.8, 0.8]} />
                  <meshPhysicalMaterial 
                    color="#88ccff" 
                    emissive="#88ccff" 
                    emissiveIntensity={Math.random() * 0.5 + 0.2} 
                    metalness={0.9}
                    roughness={0.1}
                    transmission={0.5} 
                    transparent
                    opacity={0.9}
                    reflectivity={0.9}
                  />
                </mesh>
                {/* Back windows */}
                <mesh position={[0, 0, -dimensions.depth / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
                  <planeGeometry args={[dimensions.width - 0.8, 0.8]} />
                  <meshPhysicalMaterial 
                    color="#88ccff" 
                    emissive="#88ccff" 
                    emissiveIntensity={Math.random() * 0.5 + 0.2} 
                    metalness={0.9}
                    roughness={0.1}
                    transmission={0.5} 
                    transparent
                    opacity={0.9}
                    reflectivity={0.9}
                  />
                </mesh>
                {/* Side windows */}
                <mesh position={[dimensions.width / 2 + 0.01, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                  <planeGeometry args={[dimensions.depth - 0.8, 0.8]} />
                  <meshPhysicalMaterial 
                    color="#88ccff" 
                    emissive="#88ccff" 
                    emissiveIntensity={Math.random() * 0.5 + 0.2} 
                    metalness={0.9}
                    roughness={0.1}
                    transmission={0.5} 
                    transparent
                    opacity={0.9}
                    reflectivity={0.9}
                  />
                </mesh>
                <mesh position={[-dimensions.width / 2 - 0.01, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
                  <planeGeometry args={[dimensions.depth - 0.8, 0.8]} />
                  <meshPhysicalMaterial 
                    color="#88ccff" 
                    emissive="#88ccff" 
                    emissiveIntensity={Math.random() * 0.5 + 0.2} 
                    metalness={0.9}
                    roughness={0.1}
                    transmission={0.5} 
                    transparent
                    opacity={0.9}
                    reflectivity={0.9}
                  />
                </mesh>
              </group>
            ))}
            
            {/* Roof details */}
            <group position={[0, dimensions.height / 2 + 0.2, 0]}>
              {/* Antenna */}
              <Box 
                args={[0.1, 1.5, 0.1]} 
                position={[0, 0.75, 0]}
              >
                <meshStandardMaterial color="#222222" />
              </Box>
            </group>
          </group>
        );
      
      case 'house':
        return (
          <group ref={buildingRef}>
            {/* Main house body with texture */}
            <Box args={[dimensions.width, dimensions.height * 0.7, dimensions.depth]} castShadow>
              <meshStandardMaterial 
                {...textureProps}
                roughness={0.8} 
                metalness={0.1}
              />
            </Box>
            
            {/* More detailed roof */}
            <mesh 
              position={[0, dimensions.height * 0.7 / 2 + dimensions.height * 0.3 / 2, 0]} 
              castShadow
            >
              <coneGeometry args={[dimensions.width * 0.7, dimensions.height * 0.3, 4]} />
              <meshStandardMaterial 
                color={customizations?.roofColor || "#8B4513"} 
                roughness={0.9}
              />
            </mesh>
            
            {/* Windows */}
            <Box 
              args={[1.2, 1.2, 0.1]} 
              position={[dimensions.width * 0.25, 0, dimensions.depth / 2 + 0.05]}
            >
              <meshPhysicalMaterial 
                color="#FFFFFF" 
                metalness={0.1}
                roughness={0.1}
                transmission={0.5} 
                transparent
                opacity={0.9}
              />
            </Box>
            <Box 
              args={[1.2, 1.2, 0.1]} 
              position={[-dimensions.width * 0.25, 0, dimensions.depth / 2 + 0.05]}
            >
              <meshPhysicalMaterial 
                color="#FFFFFF" 
                metalness={0.1}
                roughness={0.1}
                transmission={0.5} 
                transparent
                opacity={0.9}
              />
            </Box>
            
            {/* Door */}
            <Box 
              args={[1.5, 2.5, 0.1]} 
              position={[0, -dimensions.height * 0.7 / 2 + 1.25, dimensions.depth / 2 + 0.05]}
            >
              <meshStandardMaterial color={customizations?.doorColor || '#4A2511'} />
            </Box>
            
            {/* Chimney */}
            <Box 
              args={[1, 2, 1]} 
              position={[dimensions.width * 0.3, dimensions.height * 0.7 / 2 + 1, dimensions.depth * 0.2]}
            >
              <meshStandardMaterial color="#8B4513" />
            </Box>
          </group>
        );
      
      case 'shop':
        return (
          <group ref={buildingRef}>
            <Box args={[dimensions.width, dimensions.height, dimensions.depth]} castShadow>
              <meshStandardMaterial color={color} />
            </Box>
            {/* Shop window */}
            <Box 
              args={[dimensions.width * 0.8, dimensions.height * 0.4, 0.1]} 
              position={[0, -dimensions.height * 0.2, dimensions.depth / 2 + 0.05]}
            >
              <meshStandardMaterial color="#88ccff" transparent opacity={0.7} />
            </Box>
            {/* Shop sign */}
            <Box 
              args={[dimensions.width * 0.6, dimensions.height * 0.15, 0.2]} 
              position={[0, dimensions.height * 0.3, dimensions.depth / 2 + 0.1]}
            >
              <meshStandardMaterial color="#ffcc00" />
            </Box>
          </group>
        );
      
      case 'tower':
        return (
          <group ref={buildingRef}>
            <Cylinder 
              args={[dimensions.width / 2, dimensions.width / 2 * 1.2, dimensions.height, 16]} 
              castShadow
            >
              <meshStandardMaterial color={color} />
            </Cylinder>
            {/* Tower top */}
            <Cylinder 
              args={[dimensions.width / 2 * 1.3, dimensions.width / 2 * 0.8, dimensions.height * 0.1, 16]} 
              position={[0, dimensions.height / 2 + dimensions.height * 0.05, 0]}
              castShadow
            >
              <meshStandardMaterial color={customizations?.roofColor || "#8B4513"} />
            </Cylinder>
            {/* Windows */}
            {Array.from({ length: 4 }).map((_, i) => (
              <Box 
                key={i}
                args={[0.8, 1.2, 0.1]} 
                position={[
                  Math.sin(i * Math.PI / 2) * (dimensions.width / 2 + 0.05),
                  0,
                  Math.cos(i * Math.PI / 2) * (dimensions.width / 2 + 0.05)
                ]}
                rotation={[0, i * Math.PI / 2, 0]}
              >
                <meshStandardMaterial color="#88ccff" />
              </Box>
            ))}
          </group>
        );
      
      default:
        return (
          <group ref={buildingRef}>
            <Box args={[dimensions.width, dimensions.height, dimensions.depth]} castShadow>
              <meshStandardMaterial color={color} />
            </Box>
          </group>
        );
    }
  };
  
  return (
    <group 
      position={[position[0], position[1] + height / 2, position[2]]}
      rotation={[0, rotation, 0]}
    >
      {renderBuilding()}
    </group>
  );
}

export default Building;