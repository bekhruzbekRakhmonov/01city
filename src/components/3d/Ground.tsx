'use client';

import { useTexture } from '@react-three/drei';
import { RepeatWrapping, DoubleSide, Vector2, CanvasTexture } from 'three';
import { useMemo } from 'react';

export function Ground() {
  // Create a procedural terrain texture
  const terrainTexture = useMemo(() => {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Base color - grass green
      ctx.fillStyle = '#91B496';
      ctx.fillRect(0, 0, size, size);
      
      // Add some texture variation
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const radius = Math.random() * 3 + 1;
        
        // Random darker and lighter patches
        ctx.fillStyle = Math.random() > 0.5 ? '#7A9A80' : '#A6C4AB';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Add some paths/roads
      ctx.strokeStyle = '#B5B5A3';
      ctx.lineWidth = 5;
      
      // Main roads
      ctx.beginPath();
      ctx.moveTo(0, size / 2);
      ctx.lineTo(size, size / 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(size / 2, 0);
      ctx.lineTo(size / 2, size);
      ctx.stroke();
      
      // Secondary paths
      for (let i = 0; i < 5; i++) {
        const y = Math.random() * size;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(size / 3, y + (Math.random() - 0.5) * 100, 2 * size / 3, y + (Math.random() - 0.5) * 100, size, y + (Math.random() - 0.5) * 100);
        ctx.stroke();
      }
    }
    
    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(5, 5);
    
    return texture;
  }, []);
  
  // Create a procedural normal map for terrain elevation
  const normalMap = useMemo(() => {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Fill with neutral normal (0.5, 0.5, 1) which is RGB(128, 128, 255)
      ctx.fillStyle = 'rgb(128, 128, 255)';
      ctx.fillRect(0, 0, size, size);
      
      // Add some random elevation changes
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const radius = Math.random() * 50 + 20;
        
        // Create a radial gradient for smooth elevation changes
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        
        // Random elevation direction
        const r = Math.random() * 40 + 108; // 128 +/- 20
        const g = Math.random() * 40 + 108; // 128 +/- 20
        
        gradient.addColorStop(0, `rgb(${r}, ${g}, 255)`);
        gradient.addColorStop(1, 'rgb(128, 128, 255)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(5, 5);
    
    return texture;
  }, []);
  
  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.1, 0]} 
      receiveShadow
    >
      <planeGeometry args={[1000, 1000, 100, 100]} />
      <meshStandardMaterial 
        map={terrainTexture}
        normalMap={normalMap}
        normalScale={new Vector2(0.5, 0.5)}
        roughness={0.8} 
        metalness={0.1}
        side={DoubleSide}
      />
    </mesh>
  );
}

// For future implementation with textures:
/*
export function Ground() {
  const textures = useTexture({
    map: '/textures/grass/grass_diffuse.jpg',
    normalMap: '/textures/grass/grass_normal.jpg',
    roughnessMap: '/textures/grass/grass_roughness.jpg',
    aoMap: '/textures/grass/grass_ao.jpg',
  });

  // Configure texture repeating
  Object.values(textures).forEach(texture => {
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(100, 100);
  });

  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.1, 0]} 
      receiveShadow
    >
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial 
        {...textures} 
        roughness={1} 
      />
    </mesh>
  );
}
*/