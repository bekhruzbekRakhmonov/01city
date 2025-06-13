import React, { useMemo } from 'react';
import { Vector3, BufferGeometry, Float32BufferAttribute } from 'three';

/**
 * Realistic low-poly mountain mesh with varied peaks and natural terrain
 */
type MountainShape = 'alpine' | 'volcanic' | 'rolling' | 'jagged' | 'mesa' | 'ridge';

type MountainProps = {
  position?: [number, number, number];
  scale?: number;
  baseColor?: string;
  peakColor?: string;
  rotation?: [number, number, number];
  seed?: number;
  complexity?: number;
  shape?: MountainShape;
};

export const Mountain: React.FC<MountainProps> = ({
  position = [0, 0, 0],
  scale = 1,
  baseColor = '#4A5D23',
  peakColor = '#E8E8E8',
  rotation = [0, 0, 0],
  seed = 42,
  complexity = 2,
  shape = 'alpine',
}) => {
  // Generate realistic mountain geometry
  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    
    // Seeded random function for consistent generation
    let seedValue = seed;
    const random = () => {
      seedValue = (seedValue * 9301 + 49297) % 233280;
      return seedValue / 233280;
    };

    // More realistic color palette
    const colors = {
      deepBase: [0.2, 0.25, 0.12],      // Dark forest green
      base: [0.35, 0.45, 0.25],         // Forest green
      midSlope: [0.45, 0.52, 0.35],     // Lighter green
      rockface: [0.55, 0.5, 0.45],      // Brown rock
      highRock: [0.65, 0.6, 0.55],      // Lighter rock
      snow: [0.9, 0.92, 0.95],          // Snow white
      peak: [0.85, 0.87, 0.9]           // Peak snow
    };

    // Create a more structured mountain with proper terrain
    const gridSize = 16 + complexity * 4; // Doubled for wider spread
    const vertices = [];
    const indices = [];
    const vertexColors = [];
    
    // Generate height map using multiple octaves of noise based on shape
    const getHeight = (x, z) => {
      const distance = Math.sqrt(x * x + z * z);
      const maxDistance = gridSize * 0.8; // Increased from 0.7 to 0.8 for wider coverage
      
      if (distance > maxDistance) return 0;
      
      const falloff = Math.max(0, 1 - (distance / maxDistance));
      let falloffCurve = Math.pow(falloff, 1.5);
      
      switch (shape) {
        case 'alpine': {
          // Sharp, jagged peaks with multiple ridges
          let height = 0;
          let amplitude = 1;
          let frequency = 0.1;
          
          for (let i = 0; i < 4; i++) {
            const noiseX = x * frequency + seed;
            const noiseZ = z * frequency + seed;
            
            const noise = Math.sin(noiseX * 1.5) * Math.cos(noiseZ * 1.2) + 
                         Math.sin(noiseX * 2.1) * Math.cos(noiseZ * 1.8) * 0.5 +
                         Math.sin(noiseX * 3.7) * Math.cos(noiseZ * 2.9) * 0.25;
            
            height += noise * amplitude;
            amplitude *= 0.5;
            frequency *= 2;
          }
          
          const peakFactor = Math.max(0, 
            Math.exp(-Math.pow(x - 2, 2) / 8 - Math.pow(z - 1, 2) / 8) * 12 +
            Math.exp(-Math.pow(x + 1, 2) / 6 - Math.pow(z + 2, 2) / 6) * 8 +
            Math.exp(-Math.pow(x - 1, 2) / 10 - Math.pow(z - 3, 2) / 10) * 6
          );
          
          return Math.max(0, (height * 3 + peakFactor) * falloffCurve);
        }
        
        case 'volcanic': {
          // Dramatic cone-shaped volcano with deep crater
          const craterRadius = 4;
          const rimHeight = 20;
          const baseHeight = 2;
          
          if (distance < craterRadius) {
            // Deep crater with steep walls
            const craterDepth = (1 - distance / craterRadius) * 8;
            const craterNoise = Math.sin(x * 1.5 + seed) * Math.cos(z * 1.5 + seed) * 0.8;
            return Math.max(0, (rimHeight - craterDepth + craterNoise) * falloffCurve);
          } else {
            // Steep cone with lava flow patterns
            const distanceFromRim = distance - craterRadius;
            const coneHeight = rimHeight * Math.exp(-distanceFromRim * distanceFromRim / 25);
            const lavaFlows = Math.abs(Math.sin(Math.atan2(z, x) * 6 + seed)) * 2;
            return Math.max(0, (baseHeight + coneHeight + lavaFlows) * falloffCurve);
          }
        }
        
        case 'rolling': {
          // Very gentle, smooth rolling hills with multiple waves
          const wave1 = Math.sin(x * 0.15 + seed) * Math.cos(z * 0.15 + seed) * 2.5;
          const wave2 = Math.sin(x * 0.25 + seed * 1.5) * Math.cos(z * 0.25 + seed * 1.5) * 1.8;
          const wave3 = Math.sin(x * 0.35 + seed * 2) * Math.cos(z * 0.35 + seed * 2) * 1.2;
          const microDetail = Math.sin(x * 1.2 + seed) * Math.cos(z * 1.2 + seed) * 0.3;
          const height = 3 + wave1 + wave2 + wave3 + microDetail;
          falloffCurve = Math.pow(falloff, 0.6); // Very gentle falloff
          return Math.max(0, height * falloffCurve);
        }
        
        case 'jagged': {
          // Extremely sharp, crystalline peaks with dramatic spires
          let height = 0;
          const spireCount = 8;
          
          for (let i = 0; i < spireCount; i++) {
            const angle = (i / spireCount) * Math.PI * 2;
            const spireX = Math.cos(angle) * (3 + Math.sin(i + seed) * 2);
            const spireZ = Math.sin(angle) * (3 + Math.cos(i + seed) * 2);
            const spireDistance = Math.sqrt(Math.pow(x - spireX, 2) + Math.pow(z - spireZ, 2));
            const spireHeight = Math.max(0, 18 - spireDistance * 4);
            height = Math.max(height, spireHeight);
          }
          
          // Add crystalline fractal noise
          const fractalNoise = Math.abs(Math.sin(x * 3 + seed)) * Math.abs(Math.cos(z * 3 + seed)) * 4;
          const sharpDetail = Math.abs(Math.sin(x * 6 + seed)) * Math.abs(Math.cos(z * 6 + seed)) * 2;
          return Math.max(0, (height + fractalNoise + sharpDetail) * falloffCurve);
        }
        
        case 'mesa': {
          // Dramatic flat-topped mesa with layered cliff faces
          const plateauRadius = 7;
          const plateauHeight = 16;
          const slopeWidth = 2;
          
          if (distance < plateauRadius) {
            // Flat plateau with minimal variation
            const plateauNoise = Math.sin(x * 0.3 + seed) * Math.cos(z * 0.3 + seed) * 0.2;
            return plateauHeight + plateauNoise;
          } else if (distance < plateauRadius + slopeWidth) {
            // Steep cliff face with rock layers
            const slopeFactor = 1 - (distance - plateauRadius) / slopeWidth;
            const layerEffect = Math.floor(plateauHeight * slopeFactor / 3) * 3; // Stepped layers
            const rockDetail = Math.sin(x * 2 + seed) * Math.cos(z * 2 + seed) * 0.5;
            return Math.max(0, (layerEffect + rockDetail) * falloffCurve);
          } else {
            // Talus slopes at base
            const baseHeight = 2 * Math.exp(-(distance - plateauRadius - slopeWidth));
            return Math.max(0, baseHeight * falloffCurve);
          }
        }
        
        case 'ridge': {
          // Dramatic knife-edge ridge with multiple peaks
          const ridgeDirection = Math.PI / 6; // 30 degrees
          const ridgeX = Math.cos(ridgeDirection);
          const ridgeZ = Math.sin(ridgeDirection);
          
          // Distance from ridge line
          const ridgeDistance = Math.abs(x * ridgeZ - z * ridgeX);
          const alongRidge = x * ridgeX + z * ridgeZ;
          
          // Sharp ridge profile
          const ridgeHeight = Math.max(0, 14 - ridgeDistance * 3);
          
          // Multiple peaks along the ridge
          const peakPattern = Math.sin(alongRidge * 0.4 + seed) * 4 + Math.sin(alongRidge * 0.8 + seed * 1.5) * 2;
          const sharpDetail = Math.abs(Math.sin(alongRidge * 2 + seed)) * 1.5;
          
          // Saddles and cols
          const saddleEffect = Math.cos(alongRidge * 0.2 + seed) * 3;
          
          return Math.max(0, (ridgeHeight + peakPattern + sharpDetail + saddleEffect) * falloffCurve);
        }
        
        default:
          return 0;
      }
    };

    // Get color based on height, slope, and mountain shape
    const getColor = (height, slope) => {
      const maxHeight = shape === 'rolling' ? 8 : shape === 'volcanic' ? 25 : shape === 'jagged' ? 22 : shape === 'mesa' ? 18 : 20;
      const heightRatio = Math.min(1, height / maxHeight);
      
      // Shape-specific coloring
      if (shape === 'volcanic') {
        // Volcanic colors - dark rock and red tints
        const volcanicColors = {
          lava: [0.4, 0.1, 0.1],
          darkRock: [0.25, 0.2, 0.15],
          ash: [0.35, 0.3, 0.25]
        };
        
        if (heightRatio > 0.8) {
          return volcanicColors.lava;
        } else if (heightRatio > 0.4) {
          return volcanicColors.darkRock;
        } else {
          return volcanicColors.ash;
        }
      }
      
      if (shape === 'mesa') {
        // Mesa colors - red rock layers
        const mesaColors = {
          redRock: [0.6, 0.35, 0.25],
          sandstone: [0.7, 0.5, 0.35],
          desert: [0.5, 0.4, 0.3]
        };
        
        if (heightRatio > 0.7) {
          return mesaColors.redRock;
        } else if (heightRatio > 0.3) {
          return mesaColors.sandstone;
        } else {
          return mesaColors.desert;
        }
      }
      
      if (shape === 'jagged') {
        // Jagged colors - grey granite and ice
        const jaggedColors = {
          ice: [0.8, 0.85, 0.9],
          granite: [0.5, 0.5, 0.55],
          darkGranite: [0.35, 0.35, 0.4]
        };
        
        if (heightRatio > 0.6) {
          return jaggedColors.ice;
        } else if (heightRatio > 0.3) {
          return jaggedColors.granite;
        } else {
          return jaggedColors.darkGranite;
        }
      }
      
      // Default coloring for alpine, rolling, and ridge
      if (slope > 0.7) {
        if (heightRatio > 0.8) {
          return colors.highRock;
        } else if (heightRatio > 0.5) {
          return colors.rockface;
        } else {
          return colors.base;
        }
      }
      
      if (heightRatio > 0.8) {
        const snowFactor = (heightRatio - 0.8) / 0.2;
        return [
          colors.highRock[0] + (colors.snow[0] - colors.highRock[0]) * snowFactor,
          colors.highRock[1] + (colors.snow[1] - colors.highRock[1]) * snowFactor,
          colors.highRock[2] + (colors.snow[2] - colors.highRock[2]) * snowFactor
        ];
      }
      
      if (heightRatio > 0.6) {
        const rockFactor = (heightRatio - 0.6) / 0.2;
        return [
          colors.midSlope[0] + (colors.rockface[0] - colors.midSlope[0]) * rockFactor,
          colors.midSlope[1] + (colors.rockface[1] - colors.midSlope[1]) * rockFactor,
          colors.midSlope[2] + (colors.rockface[2] - colors.midSlope[2]) * rockFactor
        ];
      }
      
      if (heightRatio > 0.3) {
        const midFactor = (heightRatio - 0.3) / 0.3;
        return [
          colors.base[0] + (colors.midSlope[0] - colors.base[0]) * midFactor,
          colors.base[1] + (colors.midSlope[1] - colors.base[1]) * midFactor,
          colors.base[2] + (colors.midSlope[2] - colors.base[2]) * midFactor
        ];
      }
      
      if (heightRatio > 0.1) {
        return colors.base;
      }
      
      return colors.deepBase;
    };

    // Generate vertices in a grid
    const heightMap = [];
    for (let z = -gridSize; z <= gridSize; z += 2) {
      const row = [];
      for (let x = -gridSize; x <= gridSize; x += 2) {
        const height = getHeight(x, z);
        vertices.push(x, height, z);
        row.push(height);
      }
      heightMap.push(row);
    }

    // Calculate normals and colors
    const verticesPerRow = gridSize + 1;
    for (let z = 0; z < heightMap.length; z++) {
      for (let x = 0; x < heightMap[z].length; x++) {
        const height = heightMap[z][x];
        
        // Calculate slope using neighboring vertices
        let slope = 0;
        if (x > 0 && x < heightMap[z].length - 1 && z > 0 && z < heightMap.length - 1) {
          const dx = heightMap[z][x + 1] - heightMap[z][x - 1];
          const dz = heightMap[z + 1][x] - heightMap[z - 1][x];
          slope = Math.sqrt(dx * dx + dz * dz) / 4;
        }
        
        const color = getColor(height, slope);
        vertexColors.push(...color);
      }
    }

    // Generate indices for triangles
    const rows = heightMap.length;
    const cols = heightMap[0].length;
    
    for (let z = 0; z < rows - 1; z++) {
      for (let x = 0; x < cols - 1; x++) {
        const topLeft = z * cols + x;
        const topRight = topLeft + 1;
        const bottomLeft = (z + 1) * cols + x;
        const bottomRight = bottomLeft + 1;
        
        // Create two triangles per quad
        indices.push(topLeft, bottomLeft, topRight);
        indices.push(topRight, bottomLeft, bottomRight);
      }
    }
    
    geo.setIndex(indices);
    geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geo.setAttribute('color', new Float32BufferAttribute(vertexColors, 3));
    geo.computeVertexNormals();
    
    return geo;
  }, [seed, complexity, shape]);

  return (
    <mesh
      position={position}
      scale={[scale, scale, scale]}
      rotation={rotation}
      castShadow
      receiveShadow
      geometry={geometry}
    >
      <meshStandardMaterial 
        vertexColors 
        roughness={0.8}
        metalness={0.05}
      />
    </mesh>
  );
};

// Demo scene to show the mountain
const MountainDemo = () => {
  return (
    <div style={{ width: '100%', height: '600px', background: '#87CEEB' }}>
      <canvas
        style={{ width: '100%', height: '100%' }}
        ref={(canvas) => {
          if (!canvas) return;
          
          // Three.js setup
          const scene = new THREE.Scene();
          const camera = new THREE.PerspectiveCamera(75, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
          const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
          renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          
          // Sky gradient background
          scene.background = new THREE.Color(0x87CEEB);
          scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
          
          // Lighting
          const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
          scene.add(ambientLight);
          
          const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
          directionalLight.position.set(50, 100, 50);
          directionalLight.castShadow = true;
          directionalLight.shadow.mapSize.width = 2048;
          directionalLight.shadow.mapSize.height = 2048;
          directionalLight.shadow.camera.near = 0.5;
          directionalLight.shadow.camera.far = 500;
          directionalLight.shadow.camera.left = -100;
          directionalLight.shadow.camera.right = 100;
          directionalLight.shadow.camera.top = 100;
          directionalLight.shadow.camera.bottom = -100;
          scene.add(directionalLight);
          
          // Ground plane
          const groundGeometry = new THREE.PlaneGeometry(200, 200);
          const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x3a5f3a });
          const ground = new THREE.Mesh(groundGeometry, groundMaterial);
          ground.rotation.x = -Math.PI / 2;
          ground.position.y = -1;
          ground.receiveShadow = true;
          scene.add(ground);
          
          // Create mountain using the component logic
          const createMountainGeometry = (seed, complexity, shape = 'alpine') => {
            const geo = new THREE.BufferGeometry();
            
            let seedValue = seed;
            const random = () => {
              seedValue = (seedValue * 9301 + 49297) % 233280;
              return seedValue / 233280;
            };

            const colors = {
              deepBase: [0.2, 0.25, 0.12],
              base: [0.35, 0.45, 0.25],
              midSlope: [0.45, 0.52, 0.35],
              rockface: [0.55, 0.5, 0.45],
              highRock: [0.65, 0.6, 0.55],
              snow: [0.9, 0.92, 0.95],
              peak: [0.85, 0.87, 0.9]
            };

            const gridSize = 16 + complexity * 4; // Doubled for wider spread
            const vertices = [];
            const indices = [];
            const vertexColors = [];
            
            const getHeight = (x, z) => {
              const distance = Math.sqrt(x * x + z * z);
              const maxDistance = gridSize * 0.8; // Increased from 0.7 to 0.8 for wider coverage
              
              if (distance > maxDistance) return 0;
              
              const falloff = Math.max(0, 1 - (distance / maxDistance));
              let falloffCurve = Math.pow(falloff, 1.5);
              
              switch (shape) {
                case 'alpine': {
                  let height = 0;
                  let amplitude = 1;
                  let frequency = 0.1;
                  
                  for (let i = 0; i < 4; i++) {
                    const noiseX = x * frequency + seed;
                    const noiseZ = z * frequency + seed;
                    
                    const noise = Math.sin(noiseX * 1.5) * Math.cos(noiseZ * 1.2) + 
                                 Math.sin(noiseX * 2.1) * Math.cos(noiseZ * 1.8) * 0.5 +
                                 Math.sin(noiseX * 3.7) * Math.cos(noiseZ * 2.9) * 0.25;
                    
                    height += noise * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                  }
                  
                  const peakFactor = Math.max(0, 
                    Math.exp(-Math.pow(x - 2, 2) / 8 - Math.pow(z - 1, 2) / 8) * 12 +
                    Math.exp(-Math.pow(x + 1, 2) / 6 - Math.pow(z + 2, 2) / 6) * 8 +
                    Math.exp(-Math.pow(x - 1, 2) / 10 - Math.pow(z - 3, 2) / 10) * 6
                  );
                  
                  return Math.max(0, (height * 3 + peakFactor) * falloffCurve);
                }
                
                case 'volcanic': {
                  const craterRadius = 4;
                  const rimHeight = 20;
                  const baseHeight = 2;
                  
                  if (distance < craterRadius) {
                    const craterDepth = (1 - distance / craterRadius) * 8;
                    const craterNoise = Math.sin(x * 1.5 + seed) * Math.cos(z * 1.5 + seed) * 0.8;
                    return Math.max(0, (rimHeight - craterDepth + craterNoise) * falloffCurve);
                  } else {
                    const distanceFromRim = distance - craterRadius;
                    const coneHeight = rimHeight * Math.exp(-distanceFromRim * distanceFromRim / 25);
                    const lavaFlows = Math.abs(Math.sin(Math.atan2(z, x) * 6 + seed)) * 2;
                    return Math.max(0, (baseHeight + coneHeight + lavaFlows) * falloffCurve);
                  }
                }
                
                case 'rolling': {
                  const wave1 = Math.sin(x * 0.15 + seed) * Math.cos(z * 0.15 + seed) * 2.5;
                  const wave2 = Math.sin(x * 0.25 + seed * 1.5) * Math.cos(z * 0.25 + seed * 1.5) * 1.8;
                  const wave3 = Math.sin(x * 0.35 + seed * 2) * Math.cos(z * 0.35 + seed * 2) * 1.2;
                  const microDetail = Math.sin(x * 1.2 + seed) * Math.cos(z * 1.2 + seed) * 0.3;
                  const height = 3 + wave1 + wave2 + wave3 + microDetail;
                  falloffCurve = Math.pow(falloff, 0.6);
                  return Math.max(0, height * falloffCurve);
                }
                
                case 'jagged': {
                  let height = 0;
                  const spireCount = 8;
                  
                  for (let i = 0; i < spireCount; i++) {
                    const angle = (i / spireCount) * Math.PI * 2;
                    const spireX = Math.cos(angle) * (3 + Math.sin(i + seed) * 2);
                    const spireZ = Math.sin(angle) * (3 + Math.cos(i + seed) * 2);
                    const spireDistance = Math.sqrt(Math.pow(x - spireX, 2) + Math.pow(z - spireZ, 2));
                    const spireHeight = Math.max(0, 18 - spireDistance * 4);
                    height = Math.max(height, spireHeight);
                  }
                  
                  const fractalNoise = Math.abs(Math.sin(x * 3 + seed)) * Math.abs(Math.cos(z * 3 + seed)) * 4;
                  const sharpDetail = Math.abs(Math.sin(x * 6 + seed)) * Math.abs(Math.cos(z * 6 + seed)) * 2;
                  return Math.max(0, (height + fractalNoise + sharpDetail) * falloffCurve);
                }
                
                case 'mesa': {
                  const plateauRadius = 7;
                  const plateauHeight = 16;
                  const slopeWidth = 2;
                  
                  if (distance < plateauRadius) {
                    const plateauNoise = Math.sin(x * 0.3 + seed) * Math.cos(z * 0.3 + seed) * 0.2;
                    return plateauHeight + plateauNoise;
                  } else if (distance < plateauRadius + slopeWidth) {
                    const slopeFactor = 1 - (distance - plateauRadius) / slopeWidth;
                    const layerEffect = Math.floor(plateauHeight * slopeFactor / 3) * 3;
                    const rockDetail = Math.sin(x * 2 + seed) * Math.cos(z * 2 + seed) * 0.5;
                    return Math.max(0, (layerEffect + rockDetail) * falloffCurve);
                  } else {
                    const baseHeight = 2 * Math.exp(-(distance - plateauRadius - slopeWidth));
                    return Math.max(0, baseHeight * falloffCurve);
                  }
                }
                
                case 'ridge': {
                  const ridgeDirection = Math.PI / 6;
                  const ridgeX = Math.cos(ridgeDirection);
                  const ridgeZ = Math.sin(ridgeDirection);
                  
                  const ridgeDistance = Math.abs(x * ridgeZ - z * ridgeX);
                  const alongRidge = x * ridgeX + z * ridgeZ;
                  
                  const ridgeHeight = Math.max(0, 14 - ridgeDistance * 3);
                  const peakPattern = Math.sin(alongRidge * 0.4 + seed) * 4 + Math.sin(alongRidge * 0.8 + seed * 1.5) * 2;
                  const sharpDetail = Math.abs(Math.sin(alongRidge * 2 + seed)) * 1.5;
                  const saddleEffect = Math.cos(alongRidge * 0.2 + seed) * 3;
                  
                  return Math.max(0, (ridgeHeight + peakPattern + sharpDetail + saddleEffect) * falloffCurve);
                }
                
                default:
                  return 0;
              }
            };

            const getColor = (height, slope) => {
              const maxHeight = shape === 'rolling' ? 8 : shape === 'volcanic' ? 25 : shape === 'jagged' ? 22 : shape === 'mesa' ? 18 : 20;
              const heightRatio = Math.min(1, height / maxHeight);
              
              if (shape === 'volcanic') {
                const volcanicColors = {
                  lava: [0.4, 0.1, 0.1],
                  darkRock: [0.25, 0.2, 0.15],
                  ash: [0.35, 0.3, 0.25]
                };
                
                if (heightRatio > 0.8) {
                  return volcanicColors.lava;
                } else if (heightRatio > 0.4) {
                  return volcanicColors.darkRock;
                } else {
                  return volcanicColors.ash;
                }
              }
              
              if (shape === 'mesa') {
                const mesaColors = {
                  redRock: [0.6, 0.35, 0.25],
                  sandstone: [0.7, 0.5, 0.35],
                  desert: [0.5, 0.4, 0.3]
                };
                
                if (heightRatio > 0.7) {
                  return mesaColors.redRock;
                } else if (heightRatio > 0.3) {
                  return mesaColors.sandstone;
                } else {
                  return mesaColors.desert;
                }
              }
              
              if (shape === 'jagged') {
                const jaggedColors = {
                  ice: [0.8, 0.85, 0.9],
                  granite: [0.5, 0.5, 0.55],
                  darkGranite: [0.35, 0.35, 0.4]
                };
                
                if (heightRatio > 0.6) {
                  return jaggedColors.ice;
                } else if (heightRatio > 0.3) {
                  return jaggedColors.granite;
                } else {
                  return jaggedColors.darkGranite;
                }
              }
              
              if (slope > 0.7) {
                if (heightRatio > 0.8) {
                  return colors.highRock;
                } else if (heightRatio > 0.5) {
                  return colors.rockface;
                } else {
                  return colors.base;
                }
              }
              
              if (heightRatio > 0.8) {
                const snowFactor = (heightRatio - 0.8) / 0.2;
                return [
                  colors.highRock[0] + (colors.snow[0] - colors.highRock[0]) * snowFactor,
                  colors.highRock[1] + (colors.snow[1] - colors.highRock[1]) * snowFactor,
                  colors.highRock[2] + (colors.snow[2] - colors.highRock[2]) * snowFactor
                ];
              }
              
              if (heightRatio > 0.6) {
                const rockFactor = (heightRatio - 0.6) / 0.2;
                return [
                  colors.midSlope[0] + (colors.rockface[0] - colors.midSlope[0]) * rockFactor,
                  colors.midSlope[1] + (colors.rockface[1] - colors.midSlope[1]) * rockFactor,
                  colors.midSlope[2] + (colors.rockface[2] - colors.midSlope[2]) * rockFactor
                ];
              }
              
              if (heightRatio > 0.3) {
                const midFactor = (heightRatio - 0.3) / 0.3;
                return [
                  colors.base[0] + (colors.midSlope[0] - colors.base[0]) * midFactor,
                  colors.base[1] + (colors.midSlope[1] - colors.base[1]) * midFactor,
                  colors.base[2] + (colors.midSlope[2] - colors.base[2]) * midFactor
                ];
              }
              
              if (heightRatio > 0.1) {
                return colors.base;
              }
              
              return colors.deepBase;
            };

            const heightMap = [];
            for (let z = -gridSize; z <= gridSize; z += 2) {
              const row = [];
              for (let x = -gridSize; x <= gridSize; x += 2) {
                const height = getHeight(x, z);
                vertices.push(x, height, z);
                row.push(height);
              }
              heightMap.push(row);
            }

            const verticesPerRow = gridSize + 1;
            for (let z = 0; z < heightMap.length; z++) {
              for (let x = 0; x < heightMap[z].length; x++) {
                const height = heightMap[z][x];
                
                let slope = 0;
                if (x > 0 && x < heightMap[z].length - 1 && z > 0 && z < heightMap.length - 1) {
                  const dx = heightMap[z][x + 1] - heightMap[z][x - 1];
                  const dz = heightMap[z + 1][x] - heightMap[z - 1][x];
                  slope = Math.sqrt(dx * dx + dz * dz) / 4;
                }
                
                const color = getColor(height, slope);
                vertexColors.push(...color);
              }
            }

            const rows = heightMap.length;
            const cols = heightMap[0].length;
            
            for (let z = 0; z < rows - 1; z++) {
              for (let x = 0; x < cols - 1; x++) {
                const topLeft = z * cols + x;
                const topRight = topLeft + 1;
                const bottomLeft = (z + 1) * cols + x;
                const bottomRight = bottomLeft + 1;
                
                indices.push(topLeft, bottomLeft, topRight);
                indices.push(topRight, bottomLeft, bottomRight);
              }
            }
            
            geo.setIndex(indices);
            geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geo.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
            geo.computeVertexNormals();
            
            return geo;
          };
          
          // Create multiple mountains with different shapes
          const mountainShapes = ['alpine', 'volcanic', 'rolling', 'jagged', 'mesa', 'ridge'];
          
          const mountain1 = new THREE.Mesh(
            createMountainGeometry(42, 2, 'alpine'),
            new THREE.MeshStandardMaterial({ 
              vertexColors: true, 
              roughness: 0.8,
              metalness: 0.05
            })
          );
          mountain1.position.set(0, 0, 0);
          mountain1.castShadow = true;
          mountain1.receiveShadow = true;
          scene.add(mountain1);
          
          const mountain2 = new THREE.Mesh(
            createMountainGeometry(123, 1, 'volcanic'),
            new THREE.MeshStandardMaterial({ 
              vertexColors: true, 
              roughness: 0.8,
              metalness: 0.05
            })
          );
          mountain2.position.set(-25, 0, -15);
          mountain2.scale.set(0.8, 0.8, 0.8);
          mountain2.castShadow = true;
          mountain2.receiveShadow = true;
          scene.add(mountain2);
          
          const mountain3 = new THREE.Mesh(
            createMountainGeometry(456, 1, 'mesa'),
            new THREE.MeshStandardMaterial({ 
              vertexColors: true, 
              roughness: 0.8,
              metalness: 0.05
            })
          );
          mountain3.position.set(30, 0, -20);
          mountain3.scale.set(0.6, 0.6, 0.6);
          mountain3.castShadow = true;
          mountain3.receiveShadow = true;
          scene.add(mountain3);
          
          const mountain4 = new THREE.Mesh(
            createMountainGeometry(789, 1, 'ridge'),
            new THREE.MeshStandardMaterial({ 
              vertexColors: true, 
              roughness: 0.8,
              metalness: 0.05
            })
          );
          mountain4.position.set(-10, 0, 25);
          mountain4.scale.set(0.7, 0.7, 0.7);
          mountain4.castShadow = true;
          mountain4.receiveShadow = true;
          scene.add(mountain4);
          
          const mountain5 = new THREE.Mesh(
            createMountainGeometry(321, 1, 'jagged'),
            new THREE.MeshStandardMaterial({ 
              vertexColors: true, 
              roughness: 0.8,
              metalness: 0.05
            })
          );
          mountain5.position.set(15, 0, 30);
          mountain5.scale.set(0.5, 0.5, 0.5);
          mountain5.castShadow = true;
          mountain5.receiveShadow = true;
          scene.add(mountain5);
          
          const mountain6 = new THREE.Mesh(
            createMountainGeometry(654, 1, 'rolling'),
            new THREE.MeshStandardMaterial({ 
              vertexColors: true, 
              roughness: 0.8,
              metalness: 0.05
            })
          );
          mountain6.position.set(-35, 0, 10);
          mountain6.scale.set(0.9, 0.9, 0.9);
          mountain6.castShadow = true;
          mountain6.receiveShadow = true;
          scene.add(mountain6);
          
          // Camera position
          camera.position.set(25, 15, 25);
          camera.lookAt(0, 5, 0);
          
          // Animation loop
          const animate = () => {
            requestAnimationFrame(animate);
            
            // Slowly rotate camera around the mountains
            const time = Date.now() * 0.0005;
            camera.position.x = Math.cos(time) * 40;
            camera.position.z = Math.sin(time) * 40;
            camera.lookAt(0, 5, 0);
            
            renderer.render(scene, camera);
          };
          
          animate();
          
          // Handle resize
          const handleResize = () => {
            camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
          };
          
          window.addEventListener('resize', handleResize);
          
          return () => {
            window.removeEventListener('resize', handleResize);
          };
        }}
      />
    </div>
  );
};

export default MountainDemo;