import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Building } from '../3d/Building';

// Test component to demonstrate advertising functionality
export function AdvertisingTest() {
  // Sample building with advertising data
  const testBuilding = {
    type: 'skyscraper',
    position: [0, 0, 0] as [number, number, number],
    height: 8,
    color: '#4A90E2',
    rotation: 0,
    advertising: {
      enabled: true,
      companyName: 'TechCorp Solutions',
      website: 'https://techcorp.com',
      logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNEE5MEUyIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VEM8L3RleHQ+Cjwvc3ZnPg==',
      description: 'Leading technology solutions provider',
      contactEmail: 'contact@techcorp.com'
    }
  };

  const testBuildingNoAd = {
    type: 'house',
    position: [10, 0, 0] as [number, number, number],
    height: 4,
    color: '#E74C3C',
    rotation: 0,
    advertising: {
      enabled: false,
      companyName: '',
    }
  };

  const testBuildingWithTextOnly = {
    type: 'shop',
    position: [-10, 0, 0] as [number, number, number],
    height: 3,
    color: '#2ECC71',
    rotation: 0,
    advertising: {
      enabled: true,
      companyName: 'Green Market',
      website: 'https://greenmarket.com',
      description: 'Fresh organic produce'
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ position: [15, 10, 15], fov: 60 }}
        shadows
      >
        <Environment preset="city" />
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        
        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#f0f0f0" />
        </mesh>
        
        {/* Test buildings */}
        <Building
          type={testBuilding.type}
          position={testBuilding.position}
          height={testBuilding.height}
          color={testBuilding.color}
          rotation={testBuilding.rotation}
          advertising={testBuilding.advertising}
        />
        
        <Building
          type={testBuildingNoAd.type}
          position={testBuildingNoAd.position}
          height={testBuildingNoAd.height}
          color={testBuildingNoAd.color}
          rotation={testBuildingNoAd.rotation}
          advertising={testBuildingNoAd.advertising}
        />
        
        <Building
          type={testBuildingWithTextOnly.type}
          position={testBuildingWithTextOnly.position}
          height={testBuildingWithTextOnly.height}
          color={testBuildingWithTextOnly.color}
          rotation={testBuildingWithTextOnly.rotation}
          advertising={testBuildingWithTextOnly.advertising}
        />
        
        <OrbitControls enablePan enableZoom enableRotate />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h3>Advertising Banner Test</h3>
        <p><strong>Blue Building:</strong> Full advertising with logo and text</p>
        <p><strong>Red Building:</strong> No advertising enabled</p>
        <p><strong>Green Building:</strong> Text-only advertising</p>
        <p>Use mouse to orbit around and inspect the banners!</p>
      </div>
    </div>
  );
}

export default AdvertisingTest;