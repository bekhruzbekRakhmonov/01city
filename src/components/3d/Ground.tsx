'use client';

import { RepeatWrapping, DoubleSide, Vector2, CanvasTexture } from 'three';
import { useMemo } from 'react';
import { Mountain } from './Mountain';

export function Ground() {
  const terrainTexture = useMemo(() => {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Fill base with vibrant grass green
      ctx.fillStyle = '#5f9e51'; // Balanced vibrant grass green
      ctx.fillRect(0, 0, size, size);

      // Dark green blades
      ctx.fillStyle = '#3c7522';
      for (let i = 0; i < 50000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const w = Math.random() * 1 + 0.5;
        const h = Math.random() * 4 + 1;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((Math.random() - 0.5) * 0.4); // simulate grass direction
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      // Lighter green blades
      ctx.fillStyle = '#88cc66';
      for (let i = 0; i < 30000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const w = Math.random() * 0.8 + 0.3;
        const h = Math.random() * 3 + 1;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((Math.random() - 0.5) * 0.3);
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      // Subtle noise for realism
      for (let i = 0; i < 10000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const value = Math.floor(Math.random() * 30 + 100); // 100–130 green noise
        ctx.fillStyle = `rgb(${value - 20}, ${value}, ${value - 20})`;
        ctx.fillRect(x, y, 1, 1);
      }

      // Earth path strokes
      ctx.strokeStyle = '#a0845c';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, size / 2);
      ctx.bezierCurveTo(size / 3, size / 2 + 50, 2 * size / 3, size / 2 - 50, size, size / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(size / 2, 0);
      ctx.bezierCurveTo(size / 2 + 50, size / 3, size / 2 - 50, 2 * size / 3, size / 2, size);
      ctx.stroke();
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(10, 10);
    texture.anisotropy = 16;

    return texture;
  }, []);

  const normalMap = useMemo(() => {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = 'rgb(128,128,255)';
      ctx.fillRect(0, 0, size, size);

      // Add random soft bumps for elevation variation
      for (let i = 0; i < 500; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const radius = Math.random() * 30 + 10;

        const r = 120 + Math.random() * 16;
        const g = 120 + Math.random() * 16;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgb(${r},${g},255)`);
        gradient.addColorStop(1, 'rgb(128,128,255)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(10, 10);
    texture.anisotropy = 16;

    return texture;
  }, []);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <circleGeometry args={[600, 128]} />
        <meshStandardMaterial
          map={terrainTexture}
          normalMap={normalMap}
          normalScale={new Vector2(0.25, 0.25)}
          roughness={1}
          metalness={0.02}
          side={DoubleSide}
        />
      </mesh>

      {/* Mountains around the edge */}
      {Array.from({ length: 100 }).map((_, i) => {
        const angle = (i / 100) * Math.PI * 2;
        const radius = 590; // No jitter
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = -1; // Align with ground plane position
        const scale = 3; // Drastically increased scale
        const rot = Math.random() * Math.PI * 2;
        
        // Cycle through different mountain shapes
        const shapes = ['alpine', 'volcanic', 'rolling', 'jagged', 'ridge'];
        const shape = shapes[i % shapes.length];
        
        return (
          <Mountain
            key={i}
            position={[x, y, z]}
            scale={scale}
            rotation={[0, rot, 0]}
            shape={shape}
            seed={i * 123} // Different seed for each mountain
          />
        );
      })}
    </>
  );
}
