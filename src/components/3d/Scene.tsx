'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Environment, Stars, Cloud, Clouds, useHelper } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';
import { City } from './City';
import { LoadingScreen } from '../ui/LoadingScreen';

// Light helper component to visualize light direction and position
function LightWithHelper() {
  const lightRef = useRef();
  useHelper(lightRef, THREE.DirectionalLightHelper, 5, 'red');
  
  return (
    <directionalLight
      ref={lightRef}
      castShadow
      position={[50, 50, 30]}
      intensity={1.2}
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0001}
    >
      <orthographicCamera
        attach="shadow-camera"
        args={[-100, 100, 100, -100, 0.1, 500]}
        far={500}
      />
    </directionalLight>
  );
}

export function Scene() {
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas
        shadows
        camera={{ position: [50, 50, 50], fov: 45 }}
        gl={{ antialias: true }}
        style={{ background: '#87CEEB' }}
        dpr={[1, 2]} // Responsive rendering for different device pixel ratios
      >
        <Suspense fallback={null}>
          {/* Enhanced sky with more realistic Silicon Valley lighting */}
          <Sky 
            distance={450000} 
            sunPosition={[100, 40, 100]} 
            inclination={0.6}
            azimuth={0.2}
            rayleigh={0.8}
            turbidity={10}
          />
          
          {/* Ambient light for general illumination */}
          <ambientLight intensity={0.5} color="#E0F7FF" />
          
          {/* Main directional light (California sun) */}
          <LightWithHelper />
          
          {/* Secondary fill light */}
          <directionalLight
            position={[-30, 20, -10]}
            intensity={0.4}
            color="#FFF8E0"
          />
          
          {/* Add fog effect for Bay Area atmosphere */}
          <fog attach="fog" args={['#E0F7FF', 100, 300]} />
          
          {/* Decorative clouds - fewer and higher for Silicon Valley clear skies */}
          <Clouds material={THREE.MeshBasicMaterial}>
            <Cloud 
              position={[-60, 80, -120]} 
              speed={0.2} 
              opacity={0.5} 
              width={70} 
              depth={10} 
              segments={20} 
            />
            <Cloud 
              position={[60, 70, -100]} 
              speed={0.1} 
              opacity={0.4} 
              width={80} 
              depth={10} 
              segments={20} 
            />
          </Clouds>
          
          {/* Environment map for realistic reflections on glass buildings */}
          <Environment preset="sunset" background={false} />
          
          {/* Stars visible in the distance - fewer for urban tech area */}
          <Stars radius={300} depth={50} count={500} factor={4} fade speed={1} />
          
          {/* The city itself */}
          <City />
          
          {/* Enhanced camera controls */}
          <OrbitControls 
            enableZoom={true} 
            enablePan={true} 
            minPolarAngle={0.2} 
            maxPolarAngle={Math.PI / 2.1} 
            minDistance={15}
            maxDistance={200}
            enableDamping={true}
            dampingFactor={0.05}
          />
          
          {/* Environment map for realistic reflections */}
          <Environment preset="city" background={false} />
          
          {/* Fog to create depth and atmosphere */}
          <fog attach="fog" args={['#E6F0FF', 100, 400]} />
        </Suspense>
      </Canvas>
    </div>
  );
}