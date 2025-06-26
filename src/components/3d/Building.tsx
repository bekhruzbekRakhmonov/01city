import * as THREE from 'three';
import { useRef, useState, useMemo, useEffect } from 'react';
import { Box, RoundedBox, Cylinder, Text, Sphere, Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { BuildingModel } from './BuildingModel';
import { PlotInfo } from '../ui/PlotInfo';

// Define types for building props
interface BuildingProps {
  type: string;
  position: [number, number, number];
  height: number;
  color: string;
  rotation: number;
  customizations?: {
    roofColor?: string;
    doorColor?: string;
    logoColor?: string;
    windowPattern?: string;
    signText?: string;
  };
  selectedModel?: {
    id: string;
    name: string;
    description?: string;
    type: string; // 'model' or 'procedural'
    modelType?: string; // for 3D models
    buildingType?: string; // for procedural buildings
  };
  plotId?: string;
  onInteract?: (plotId: string) => void;
  companyInfo?: {
    companyName: string;
    website: string;
    logoSvg: string;
    shortDescription: string;
  };
}

export function Building({ 
  type,
  position,
  height,
  color,
  rotation,
  customizations,
  selectedModel,
  plotId,
  onInteract,
  companyInfo
}: BuildingProps) {
  console.log("selectedModel", selectedModel)
  const buildingRef = useRef<THREE.Object3D>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const { camera } = useThree();
  
  // Enhanced texture generation with more detail
  const textureProps = useMemo(() => {
    const textureSize = 1024; // Higher resolution
    const canvas = document.createElement('canvas');
    canvas.width = textureSize;
    canvas.height = textureSize;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Base color with slight gradient for more realism
      const gradient = ctx.createLinearGradient(0, 0, 0, textureSize);
      const baseColor = new THREE.Color(color);
      const darkerColor = new THREE.Color(color).multiplyScalar(0.85);
      
      gradient.addColorStop(0, baseColor.getStyle());
      gradient.addColorStop(1, darkerColor.getStyle());
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, textureSize, textureSize);
      
      // Add texture details based on building type
      switch(type) {
        case 'skyscraper':
          // Modern glass panel pattern
          const panelSize = textureSize / 20;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          
          for (let i = 0; i <= textureSize; i += panelSize) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, textureSize);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(textureSize, i);
            ctx.stroke();
            
            // Add reflective highlights to some panels
            if (Math.random() > 0.7) {
              const x = Math.floor(i / panelSize) * panelSize;
              const y = Math.floor(Math.random() * (textureSize / panelSize)) * panelSize;
              
              ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
              ctx.fillRect(x, y, panelSize, panelSize);
            }
          }
          break;
          
        case 'house':
          // Enhanced brick pattern with depth simulation
          const brickWidth = textureSize / 20;
          const brickHeight = textureSize / 10;
          
          for (let y = 0; y < textureSize; y += brickHeight) {
            const offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);
            
            for (let x = -brickWidth/2; x < textureSize; x += brickWidth) {
              // Brick base color with variation
              const variation = Math.random() * 0.1 - 0.05;
              const brickColor = new THREE.Color(color).multiplyScalar(0.9 + variation);
              ctx.fillStyle = brickColor.getStyle();
              ctx.fillRect(x + offset, y, brickWidth - 2, brickHeight - 2);
              
              // Add brick texture - mortar and highlights
              ctx.strokeStyle = '#555555';
              ctx.lineWidth = 2;
              ctx.strokeRect(x + offset, y, brickWidth - 2, brickHeight - 2);
              
              // Add some noise/texture to each brick
              for (let i = 0; i < 5; i++) {
                const dotX = x + offset + Math.random() * brickWidth;
                const dotY = y + Math.random() * brickHeight;
                const dotSize = Math.random() * 2 + 1;
                
                ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.1})`;
                ctx.beginPath();
                ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
          break;
          
        case 'shop':
          // Storefront texture with signage area
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, textureSize, textureSize);
          
          // Storefront details
          const storeWindowHeight = textureSize * 0.4;
          ctx.fillStyle = '#333333';
          ctx.fillRect(0, textureSize - storeWindowHeight, textureSize, storeWindowHeight);
          
          // Sign area
          ctx.fillStyle = '#222222';
          ctx.fillRect(textureSize * 0.1, textureSize * 0.1, textureSize * 0.8, textureSize * 0.2);
          
          if (customizations?.signText) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${textureSize * 0.1}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(customizations.signText, textureSize * 0.5, textureSize * 0.2);
          }
          break;
          
        case 'techCampus':
          // Modern campus with glass and metal elements
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, textureSize, textureSize);
          
          // Horizontal bands of glass
          for (let y = textureSize * 0.2; y < textureSize; y += textureSize * 0.2) {
            ctx.fillStyle = 'rgba(120, 180, 255, 0.7)';
            ctx.fillRect(0, y, textureSize, textureSize * 0.1);
            
            // Metal frames
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 3;
            ctx.strokeRect(0, y, textureSize, textureSize * 0.1);
            
            // Vertical dividers
            for (let x = textureSize * 0.1; x < textureSize; x += textureSize * 0.1) {
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x, y + textureSize * 0.1);
              ctx.stroke();
            }
          }
          break;
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, height / 5);
    
    // Create normal map for surface detail
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = textureSize;
    normalCanvas.height = textureSize;
    const normalCtx = normalCanvas.getContext('2d');
    
    if (normalCtx) {
      normalCtx.fillStyle = '#8080ff'; // Neutral normal map color
      normalCtx.fillRect(0, 0, textureSize, textureSize);
      
      // Add normal map details based on building type
      if (type === 'house' || type === 'shop') {
        // Create bump effect for bricks or panels
        const bumpSize = type === 'house' ? textureSize / 20 : textureSize / 10;
        
        for (let y = 0; y < textureSize; y += bumpSize) {
          for (let x = 0; x < textureSize; x += bumpSize) {
            const bumpIntensity = Math.random() * 30 + 100;
            normalCtx.fillStyle = `rgb(${bumpIntensity}, ${bumpIntensity}, 255)`;
            normalCtx.fillRect(x, y, bumpSize - 1, bumpSize - 1);
          }
        }
      }
    }
    
    const normalTexture = new THREE.CanvasTexture(normalCanvas);
    normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
    normalTexture.repeat.set(2, height / 3);
    
    return { 
      map: texture, 
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(0.5, 0.5)
    };
  }, [color, type, height, customizations]);
  


  
  // Hover and click effects
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hovered]);
  
  // Subtle animation effects
  useFrame((state) => {
    if (buildingRef.current) {
      // Subtle hover animation
      if (hovered) {
        buildingRef.current.scale.y = THREE.MathUtils.lerp(
          buildingRef.current.scale.y,
          1.02,
          0.1
        );
        
        // Emit subtle glow when hovered
        const emissiveIntensity = (Math.sin(state.clock.elapsedTime * 2) * 0.1) + 0.2;
        buildingRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat.emissive) mat.emissiveIntensity = emissiveIntensity;
              });
            } else if (child.material.emissive) {
              child.material.emissiveIntensity = emissiveIntensity;
            }
          }
        });
      } else {
        buildingRef.current.scale.y = THREE.MathUtils.lerp(
          buildingRef.current.scale.y,
          1,
          0.1
        );
        
        // Reset emissive intensity
        buildingRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat.emissive) mat.emissiveIntensity = 0;
              });
            } else if (child.material.emissive) {
              child.material.emissiveIntensity = 0;
            }
          }
        });
      }
      
      // Subtle breathing animation
      buildingRef.current.position.y = position[1] + height / 2 + position[1] + height / 2 + Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
    }
  });
  
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
        return { width: 8, depth: 8, height: Math.min(height, 4) };
      case 'startupOffice':
        return { width: 5, depth: 6, height };
      case 'dataCenter':
        return { width: 7, depth: 9, height };
      default:
        return { width: 5, depth: 5, height };
    }
  };
  
  const dimensions = getBuildingDimensions();
  
  // Create SVG texture for logo
  const svgTexture = useMemo(() => {
    if (!companyInfo?.logoSvg) return null;
    
    // Create a blob URL from SVG content
    const svgBlob = new Blob([companyInfo.logoSvg], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    // Create texture from SVG
    const loader = new THREE.TextureLoader();
    const texture = loader.load(svgUrl);
    texture.flipY = false;
    
    return texture;
  }, [companyInfo?.logoSvg]);


  
  // Handle interaction
  const handleClick = (e) => {
    e.stopPropagation();
    setClicked(!clicked);
    setShowInfoModal(true);
    
    if (onInteract && plotId) {
      onInteract(plotId);
    }
  };
  
  // Render different building types with enhanced details
  const renderBuilding = () => {
    // If a 3D model is selected, render it instead of procedural building
    if (selectedModel && selectedModel.type === 'model' && selectedModel.modelType) {
      return (
        <group ref={buildingRef} rotation={[0, rotation, 0]} onClick={handleClick}>
          <BuildingModel
            modelType={selectedModel.modelType as 'low_poly' | 'sugarcube'}
            scale={height * 3} // Scale based on height
            position={[0, 0, 0]}
            color={color}
            selected={hovered || clicked}
            height={height}
            companyInfo={companyInfo}
          />
        </group>
      );
    }
    
    switch (type) {
      case 'skyscraper':
        return (
          <group ref={buildingRef} rotation={[0, rotation, 0]} onClick={handleClick}>
            {/* Main building structure with improved materials */}
            <RoundedBox 
              args={[dimensions.width, dimensions.height, dimensions.depth]} 
              radius={0.1}
              smoothness={4}
              castShadow
              receiveShadow
            >
              <meshPhysicalMaterial 
                map={textureProps.map}
                normalMap={textureProps.normalMap}
                normalScale={textureProps.normalScale}
                metalness={0.7} 
                roughness={0.2} 
                envMapIntensity={1.5}
                clearcoat={0.5}
                clearcoatRoughness={0.1}
                reflectivity={1}
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
                    transmission={0.9} 
                    transparent
                    opacity={0.9}
                    reflectivity={1}
                    ior={1.5}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
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
                    transmission={0.9} 
                    transparent
                    opacity={0.9}
                    reflectivity={1}
                    ior={1.5}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
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
                    transmission={0.9} 
                    transparent
                    opacity={0.9}
                    reflectivity={1}
                    ior={1.5}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
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
                    transmission={0.9} 
                    transparent
                    opacity={0.9}
                    reflectivity={1}
                    ior={1.5}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                  />
                </mesh>
              </group>
            ))}
            
            {/* Enhanced roof details with antennas and equipment */}
            <group position={[0, dimensions.height / 2 + 0.2, 0]}>
              <Box args={[dimensions.width * 0.7, 0.5, dimensions.depth * 0.7]} castShadow receiveShadow>
                <meshStandardMaterial color="#333333" roughness={0.8} />
              </Box>
              
              {/* Roof equipment - HVAC, etc */}
              <Box 
                args={[dimensions.width * 0.3, 0.8, dimensions.depth * 0.3]} 
                position={[dimensions.width * 0.15, 0.4, dimensions.depth * 0.15]}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial color="#555555" roughness={0.7} />
              </Box>
              
              {/* Communications equipment */}
              <group position={[0, 0.5, 0]}>
                {/* Main antenna */}
                <Cylinder 
                  args={[0.05, 0.08, 2, 8]} 
                  position={[0, 1, 0]}
                  castShadow
                >
                  <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
                </Cylinder>
                
                {/* Satellite dish */}
                <group position={[dimensions.width * 0.25, 0.5, dimensions.depth * 0.25]} rotation={[0, Math.PI / 4, 0]}>
                  <Cylinder args={[0.05, 0.05, 0.5, 8]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial color="#888888" />
                  </Cylinder>
                  <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2 - 0.3, 0, 0]}>
                    <circleGeometry args={[0.3, 16]} />
                    <meshStandardMaterial color="#CCCCCC" side={THREE.DoubleSide} />
                  </mesh>
                </group>
              </group>
            </group>
            
            {/* Building entrance with revolving door */}
            <group position={[0, -dimensions.height / 2 + 1, dimensions.depth / 2]}>
              <Box args={[2, 2, 0.3]} position={[0, 0, 0.15]} castShadow receiveShadow>
                <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.2} />
              </Box>
              
              {/* Revolving door (simplified) */}
              <Cylinder args={[0.8, 0.8, 1.8, 16]} position={[0, 0, 0.3]} castShadow>
                <meshPhysicalMaterial 
                  color="#AAAAAA" 
                  metalness={0.8} 
                  roughness={0.1}
                  transmission={0.5}
                  transparent
                  opacity={0.9}
                  clearcoat={1}
                />
              </Cylinder>
              
              {/* Building name/number */}
              <Text
                position={[0, 1.3, 0.3]}
                fontSize={0.3}
                color="#FFFFFF"
                anchorX="center"
                anchorY="middle"
              >
                {customizations?.signText || `${Math.floor(Math.random() * 999) + 1}`}
              </Text>
            </group>
          </group>
        );
      
      case 'house':
        return (
          <group ref={buildingRef} rotation={[0, rotation, 0]}>
            {/* Main house body with enhanced texture */}
            <Box 
              args={[dimensions.width, dimensions.height * 0.7, dimensions.depth]} 
              castShadow
              receiveShadow
            >
              <meshStandardMaterial 
                map={textureProps.map}
                normalMap={textureProps.normalMap}
                normalScale={textureProps.normalScale}
                roughness={0.8} 
                metalness={0.1}
                envMapIntensity={0.8}
              />
            </Box>
            
            {/* More detailed roof with shingles texture */}
            <mesh 
              position={[0, dimensions.height * 0.7 / 2 + dimensions.height * 0.3 / 2, 0]} 
              castShadow
              receiveShadow
            >
              <coneGeometry args={[dimensions.width * 0.7, dimensions.height * 0.3, 4]} />
              <meshStandardMaterial 
                color={customizations?.roofColor || "#8B4513"} 
                roughness={0.9}
                normalScale={new THREE.Vector2(0.5, 0.5)}
                map={useMemo(() => {
                  const canvas = document.createElement('canvas');
                  canvas.width = 512;
                  canvas.height = 512;
                  const ctx = canvas.getContext('2d');
                  
                  if (ctx) {
                    ctx.fillStyle = customizations?.roofColor || "#8B4513";
                    ctx.fillRect(0, 0, 512, 512);
                    
                    // Draw shingle pattern
                    const shingleHeight = 512 / 20;
                    const shingleWidth = 512 / 10;
                    
                    for (let y = 0; y < 512; y += shingleHeight) {
                      const offset = (Math.floor(y / shingleHeight) % 2) * (shingleWidth / 2);
                      
                      for (let x = 0; x < 512; x += shingleWidth) {
                        ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.2 + 0.1})`;
                        ctx.fillRect(x + offset, y, shingleWidth - 2, shingleHeight - 1);
                        ctx.strokeStyle = '#000000';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x + offset, y, shingleWidth - 2, shingleHeight - 1);
                      }
                    }
                  }
                  
                  const texture = new THREE.CanvasTexture(canvas);
                  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                  texture.repeat.set(2, 2);
                  
                  return texture;
                }, [customizations?.roofColor])}
              />
            </mesh>
            
            {/* Enhanced windows with frames and glass effect */}
            {[
              { x: dimensions.width * 0.25, z: dimensions.depth / 2 + 0.05 },
              { x: -dimensions.width * 0.25, z: dimensions.depth / 2 + 0.05 },
              { x: dimensions.width * 0.25, z: -dimensions.depth / 2 - 0.05, rot: Math.PI },
              { x: -dimensions.width * 0.25, z: -dimensions.depth / 2 - 0.05, rot: Math.PI }
            ].map((window, i) => (
              <group key={i} position={[window.x, 0, window.z]} rotation={[0, window.rot || 0, 0]}>
                {/* Window frame */}
                <Box args={[1.4, 1.4, 0.1]}>
                  <meshStandardMaterial color="#5C4033" roughness={0.8} />
                </Box>
                
                {/* Window glass */}
                <Box args={[1.2, 1.2, 0.12]} position={[0, 0, 0.02]}>
                  <meshPhysicalMaterial 
                    color="#FFFFFF" 
                    metalness={0.1}
                    roughness={0.05}
                    transmission={0.95} 
                    transparent
                    opacity={0.9}
                    ior={1.5}
                    reflectivity={0.5}
                    clearcoat={1}
                  />
                </Box>
                
                {/* Window crossbars */}
                <Box args={[1.2, 0.05, 0.15]} position={[0, 0, 0.05]}>
                  <meshStandardMaterial color="#5C4033" />
                </Box>
                <Box args={[0.05, 1.2, 0.15]} position={[0, 0, 0.05]}>
                  <meshStandardMaterial color="#5C4033" />
                </Box>
              </group>
            ))}
            
            {/* Enhanced door with frame, handle, and steps */}
            <group position={[0, -dimensions.height * 0.7 / 2 + 1.25, dimensions.depth / 2 + 0.1]}>
              {/* Door frame */}
              <Box args={[1.7, 2.7, 0.1]} position={[0, 0, -0.05]}>
                <meshStandardMaterial color="#5C4033" roughness={0.8} />
              </Box>
              
              {/* Door */}
              <Box args={[1.5, 2.5, 0.1]}>
                <meshStandardMaterial color={customizations?.doorColor || '#4A2511'} roughness={0.7} />
              </Box>
              
              {/* Door handle */}
              <Box args={[0.1, 0.1, 0.15]} position={[0.5, 0, 0.05]}>
                <meshStandardMaterial color="#B87333" metalness={0.8} roughness={0.2} />
              </Box>
              
              {/* Steps */}
              <Box args={[2, 0.2, 0.5]} position={[0, -1.35, 0.25]}>
                <meshStandardMaterial color="#888888" roughness={0.9} />
              </Box>
              <Box args={[2.5, 0.2, 0.8]} position={[0, -1.55, 0.4]}>
                <meshStandardMaterial color="#888888" roughness={0.9} />
              </Box>
            </group>
            
            {/* Enhanced chimney with smoke effect */}
            <group position={[dimensions.width * 0.3, dimensions.height * 0.7 / 2 + 1, dimensions.depth * 0.2]}>
              <Box args={[1, 2, 1]} castShadow receiveShadow>
                <meshStandardMaterial color="#8B4513" roughness={0.9} />
              </Box>
              
              {/* Chimney top */}
              <Box args={[1.2, 0.2, 1.2]} position={[0, 1.1, 0]}>
                <meshStandardMaterial color="#555555" roughness={0.8} />
              </Box>
              
                            {/* Smoke particles (simplified) */}
                            {Array.from({ length: 5 }).map((_, i) => (
                <Sphere 
                  key={i}
                  args={[0.3 + i * 0.1, 8, 8]} 
                  position={[
                    Math.sin(i * 0.5) * 0.2,
                    1.5 + i * 0.4,
                    Math.cos(i * 0.5) * 0.2
                  ]}
                >
                  <meshStandardMaterial 
                    color="#AAAAAA" 
                    transparent 
                    opacity={0.5 - i * 0.08} 
                    depthWrite={false}
                  />
                </Sphere>
              ))}
            </group>
            
            {/* Garden with flowers */}
            {customizations?.hasGarden && (
              <group position={[0, -dimensions.height * 0.7 / 2, -dimensions.depth / 2 - 1]}>
                {/* Garden soil */}
                <Box args={[dimensions.width * 1.2, 0.2, 2]} receiveShadow>
                  <meshStandardMaterial color="#3E2723" roughness={1} />
                </Box>
                
                {/* Flowers and plants */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const x = (Math.random() - 0.5) * dimensions.width;
                  const z = (Math.random() - 0.5) * 1.8;
                  const flowerType = Math.floor(Math.random() * 3);
                  const flowerColor = [
                    '#FF5252', // Red
                    '#FFEB3B', // Yellow
                    '#E040FB', // Purple
                    '#4CAF50', // Green
                    '#2196F3'  // Blue
                  ][Math.floor(Math.random() * 5)];
                  
                  return (
                    <group key={i} position={[x, 0.1, z]}>
                      {/* Stem */}
                      <Cylinder args={[0.02, 0.02, 0.4, 8]} position={[0, 0.2, 0]}>
                        <meshStandardMaterial color="#4CAF50" />
                      </Cylinder>
                      
                      {/* Flower */}
                      {flowerType === 0 && (
                        <Sphere args={[0.1, 8, 8]} position={[0, 0.45, 0]}>
                          <meshStandardMaterial color={flowerColor} />
                        </Sphere>
                      )}
                      
                      {flowerType === 1 && (
                        <group position={[0, 0.45, 0]}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Box 
                              key={j}
                              args={[0.08, 0.02, 0.15]} 
                              position={[
                                Math.sin(j * Math.PI * 2 / 5) * 0.1,
                                0,
                                Math.cos(j * Math.PI * 2 / 5) * 0.1
                              ]}
                              rotation={[0, j * Math.PI * 2 / 5, 0]}
                            >
                              <meshStandardMaterial color={flowerColor} />
                            </Box>
                          ))}
                          <Sphere args={[0.05, 8, 8]} position={[0, 0, 0]}>
                            <meshStandardMaterial color="#FFEB3B" />
                          </Sphere>
                        </group>
                      )}
                      
                      {flowerType === 2 && (
                        <Cylinder args={[0.1, 0, 0.15, 8]} position={[0, 0.45, 0]}>
                          <meshStandardMaterial color={flowerColor} />
                        </Cylinder>
                      )}
                      
                      {/* Leaves */}
                      <Box 
                        args={[0.15, 0.02, 0.1]} 
                        position={[0.08, 0.15, 0]}
                        rotation={[0, Math.PI / 4, 0]}
                      >
                        <meshStandardMaterial color="#4CAF50" />
                      </Box>
                      <Box 
                        args={[0.15, 0.02, 0.1]} 
                        position={[-0.08, 0.25, 0]}
                        rotation={[0, -Math.PI / 4, 0]}
                      >
                        <meshStandardMaterial color="#4CAF50" />
                      </Box>
                    </group>
                  );
                })}
              </group>
            )}
          </group>
        );
      
      case 'shop':
        return (
          <group ref={buildingRef} rotation={[0, rotation, 0]}>
            {/* Main shop structure */}
            <Box 
              args={[dimensions.width, dimensions.height, dimensions.depth]} 
              castShadow
              receiveShadow
            >
              <meshStandardMaterial 
                map={textureProps.map}
                normalMap={textureProps.normalMap}
               ref={buildingRef} rotation={[0, rotation, 0]}  normalScale={textureProps.normalScale}
                roughness={0.6} 
                metalness={0.2}
              />
            </Box>
            
            {/* Enhanced storefront with display window */}
            <group position={[0, -dimensions.height * 0.2, dimensions.depth / 2 + 0.05]}>
              {/* Window frame */}
              <Box args={[dimensions.width * 0.85, dimensions.height * 0.45, 0.1]}>
                <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.2} />
              </Box>
              
              {/* Display window glass */}
              <Box args={[dimensions.width * 0.8, dimensions.height * 0.4, 0.15]} position={[0, 0, 0.05]}>
                <meshPhysicalMaterial 
                  color="#FFFFFF" 
                  metalness={0.1}
                  roughness={0.05}
                  transmission={0.95} 
                  transparent
                  opacity={0.8}
                  ior={1.5}
                  reflectivity={0.5}
                  clearcoat={1}
                />
              </Box>
              
              {/* Display items (simplified) */}
              {Array.from({ length: 3 }).map((_, i) => (
                <group key={i} position={[(i - 1) * dimensions.width * 0.25, -dimensions.height * 0.1, 0.2]}>
                  <Box args={[0.5, 0.8, 0.4]} castShadow>
                    <meshStandardMaterial 
                      color={['#FF5252', '#2196F3', '#FFEB3B'][i]} 
                      roughness={0.5}
                    />
                  </Box>
                </group>
              ))}
            </group>
            
            {/* Enhanced shop sign with 3D text */}
            <group position={[0, dimensions.height * 0.3, dimensions.depth / 2 + 0.2]}>
              <Box args={[dimensions.width * 0.7, dimensions.height * 0.18, 0.3]} castShadow>
                <meshStandardMaterial 
                  color={customizations?.signColor || "#ffcc00"} 
                  roughness={0.5}
                  metalness={0.3}
                />
              </Box>
              
              <Text
                position={[0, 0, 0.2]}
                fontSize={0.4}
                color="#FFFFFF"
                anchorX="center"
                anchorY="middle"
                // font="/fonts/Inter-Bold.woff"
                maxWidth={dimensions.width * 0.6}
              >
                {customizations?.signText || "SHOP"}
              </Text>
            </group>
            
            {/* Door */}
            <group position={[0, -dimensions.height / 2 + 1, dimensions.depth / 2 + 0.1]}>
              {/* Door frame */}
              <Box args={[1.8, 2.2, 0.1]} position={[0, 0, -0.05]}>
                <meshStandardMaterial color="#333333" roughness={0.7} />
              </Box>
              
              {/* Door */}
              <Box args={[1.6, 2, 0.1]}>
                <meshPhysicalMaterial 
                  color="#AAAAAA" 
                  metalness={0.8} 
                  roughness={0.1}
                  transmission={0.5}
                  transparent
                  opacity={0.9}
                  clearcoat={1}
                />
              </Box>
              
              {/* Door handle */}
              <Box args={[0.1, 0.3, 0.15]} position={[0.6, 0, 0.05]}>
                <meshStandardMaterial color="#B87333" metalness={0.8} roughness={0.2} />
              </Box>
              
              {/* Open/Closed sign */}
              <Box args={[0.6, 0.3, 0.05]} position={[0, 0.8, 0.05]}>
                <meshStandardMaterial 
                  color={customizations?.isOpen ? "#4CAF50" : "#FF5252"} 
                  emissive={customizations?.isOpen ? "#4CAF50" : "#FF5252"}
                  emissiveIntensity={0.5}
                />
              </Box>
            </group>
            
            {/* Awning */}
            <group position={[0, -dimensions.height * 0.05, dimensions.depth / 2 + 0.6]}>
              <Box 
                args={[dimensions.width * 0.9, 0.1, 0.8]} 
                position={[0, 0, -0.4]}
                rotation={[Math.PI / 6, 0, 0]}
              >
                <meshStandardMaterial 
                  color={customizations?.awningColor || "#E91E63"} 
                  roughness={0.8}
                />
              </Box>
              
              {/* Awning supports */}
              {[-1, 1].map((side, i) => (
                <Cylinder 
                  key={i}
                  args={[0.05, 0.05, 0.8, 8]} 
                  position={[side * dimensions.width * 0.4, -0.4, 0]}
                >
                  <meshStandardMaterial color="#555555" metalness={0.5} roughness={0.5} />
                </Cylinder>
              ))}
            </group>
          </group>
        );
      
      case 'tower':
        return (
          <group ref={buildingRef} rotation={[0, rotation, 0]}>
            {/* Main tower structure with enhanced materials */}
            <Cylinder 
              args={[dimensions.width / 2, dimensions.width / 2 * 1.2, dimensions.height, 16]} 
              castShadow
              receiveShadow
            >
              <meshStandardMaterial 
           ref={buildingRef} rotation={[0, rotation, 0]}      map={textureProps.map}
                normalMap={textureProps.normalMap}
                normalScale={textureProps.normalScale}
                roughness={0.5} 
                metalness={0.3}
                envMapIntensity={1.2}
              />
            </Cylinder>
            
            {/* Enhanced tower top with detailed architecture */}
            <group position={[0, dimensions.height / 2 + dimensions.height * 0.05, 0]}>
            <Cylinder 
                args={[dimensions.width / 2 * 1.3, dimensions.width / 2 * 0.8, dimensions.height * 0.1, 16]} 
                castShadow
                receiveShadow
              >
                <meshStandardMaterial 
                  color={customizations?.roofColor || "#8B4513"} 
                  roughness={0.7}
                  metalness={0.3}
                />
              </Cylinder>
              
              {/* Decorative spire */}
              <Cylinder 
                args={[dimensions.width / 2 * 0.1, 0.05, dimensions.height * 0.3, 8]} 
                position={[0, dimensions.height * 0.2, 0]}
                castShadow
              >
                <meshStandardMaterial 
                  color="#B87333" 
                  metalness={0.8} 
                  roughness={0.2}
                />
              </Cylinder>
              
              {/* Observation deck */}
              <Cylinder 
                args={[dimensions.width / 2 * 0.7, dimensions.width / 2 * 0.7, dimensions.height * 0.05, 16]} 
                position={[0, -dimensions.height * 0.05, 0]}
                castShadow
              >
                <meshStandardMaterial color="#555555" roughness={0.6} />
              </Cylinder>
              
              {/* Observation windows */}
              {Array.from({ length: 8 }).map((_, i) => (
                <Box 
                  key={i}
                  args={[0.4, 0.6, 0.1]} 
                  position={[
                    Math.sin(i * Math.PI / 4) * (dimensions.width / 2 * 0.7),
                    -dimensions.height * 0.05,
                    Math.cos(i * Math.PI / 4) * (dimensions.width / 2 * 0.7)
                  ]}
                  rotation={[0, i * Math.PI / 4, 0]}
                >
                  <meshPhysicalMaterial 
                    color="#88ccff" 
                    metalness={0.9}
                    roughness={0.05}
                    transmission={0.9} 
                    transparent
                    opacity={0.9}
                    reflectivity={1}
                    clearcoat={1}
                  />
                </Box>
              ))}
            </group>
            
            {/* Enhanced windows with lighting effects */}
            {Array.from({ length: Math.floor(dimensions.height / 3) }).map((_, i) => (
              <group key={i} position={[0, i * 3 - dimensions.height / 2 + 1.5, 0]}>
                {Array.from({ length: 8 }).map((_, j) => {
                  const isLit = Math.random() > 0.3;
                  return (
                    <Box 
                      key={j}
                      args={[0.8, 1.2, 0.1]} 
                      position={[
                        Math.sin(j * Math.PI / 4) * (dimensions.width / 2 + 0.05),
                        0,
                        Math.cos(j * Math.PI / 4) * (dimensions.width / 2 + 0.05)
                      ]}
                      rotation={[0, j * Math.PI / 4, 0]}
                    >
                      <meshPhysicalMaterial 
                        color="#88ccff" 
                        emissive={isLit ? "#FFEB3B" : "#88ccff"}
                        emissiveIntensity={isLit ? 0.5 : 0.1}
                        metalness={0.9}
                        roughness={0.1}
                        transmission={0.5} 
                        transparent
                        opacity={0.9}
                        reflectivity={0.9}
                        clearcoat={1}
                      />
                    </Box>
                  );
                })}
              </group>
            ))}
            
            {/* Enhanced entrance with detailed architecture */}
            <group position={[0, -dimensions.height / 2, dimensions.width / 2 + 0.5]}>
              {/* Entrance arch */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[2, 3, 1]} />
                <meshStandardMaterial color={color} roughness={0.7} />
              </mesh>
              
              {/* Door */}
              <Box args={[1.5, 2.5, 0.1]} position={[0, 0, 0.55]}>
                <meshStandardMaterial 
                  color={customizations?.doorColor || "#4A2511"} 
                  roughness={0.7}
                  metalness={0.3}
                />
              </Box>
              
              {/* Steps */}
              {Array.from({ length: 3 }).map((_, i) => (
                <Box 
                  key={i}
                  args={[2 + i * 0.5, 0.2, 0.5 + i * 0.2]} 
                  position={[0, -1.5 + i * 0.2, 1 + i * 0.2]}
                  castShadow
                  receiveShadow
                >
                  <meshStandardMaterial color="#888888" roughness={0.9} />
                </Box>
              ))}
              
              {/* Decorative columns */}
              {[-1, 1].map((side, i) => (
                <Cylinder 
                  key={i}
                  args={[0.2, 0.2, 3, 8]} 
                  position={[side * 1.2, 0, 0.3]}
                  castShadow
                >
                  <meshStandardMaterial color="#DDDDDD" roughness={0.7} />
                </Cylinder>
              ))}
            </group>
          </group>
        );
      
      default:
        return (
          <group ref={buildingRef} rotation={[0, rotation, 0]}>
            <Box 
              args={[dimensions.width, dimensions.height, dimensions.depth]} 
              castShadow
              receiveShadow
            >
              <meshStandardMaterial 
                color={color} 
                roughness={0.7}
                metalness={0.2}
              />
            </Box>
          </group>
        );
    }
  };
  
  return (
    <>
      <group 
        position={[position[0], position[1] + height / 2, position[2]]}
        rotation={[0, rotation, 0]}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {renderBuilding()}
      </group>
      
      {showInfoModal && (
        <Html>
          <PlotInfo
            title={companyInfo?.companyName || selectedModel?.name || type}
            description={companyInfo?.shortDescription || `${type.charAt(0).toUpperCase() + type.slice(1)} building with height of ${height}m`}
            creatorInfo={companyInfo ? `${companyInfo.companyName} - ${companyInfo.shortDescription}` : undefined}
            onClose={() => setShowInfoModal(false)}
          />
        </Html>
      )}
    </>
  );
}

export default Building;