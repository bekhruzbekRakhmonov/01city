'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Environment, Stars, Cloud, Clouds, useHelper } from '@react-three/drei';
import { Suspense, useRef, useState } from 'react';
import * as THREE from 'three';
import { City } from './City';
import { GovernmentHelpModal } from '../ui/GovernmentHelpModal';
import { PlotInfo } from '../ui/PlotInfo';
import { useUser } from '@clerk/nextjs';
import { Id } from '../../../convex/_generated/dataModel';

interface SceneProps {
  onPlotSelect: (position: { x: number; z: number }) => void;
  onOpenMailbox: (plotId: Id<'plots'>, ownerId: string, mailboxAddress?: string) => void;
}

export function Scene({ onPlotSelect, onOpenMailbox }: SceneProps) {
  const { user } = useUser();
  const currentUserId = user?.id;
  const [isGovernmentModalOpen, setIsGovernmentModalOpen] = useState(false);
  const [showLandSelector, setShowLandSelector] = useState(false);
  const [selectedPlotData, setSelectedPlotData] = useState<any>(null);
  const [showPlotInfo, setShowPlotInfo] = useState(false);
  
  const handleChoosePlot = () => {
    setIsGovernmentModalOpen(false);
    setShowLandSelector(true);
  };

  const handleShowPlotInfo = (plotData: any) => {
    setSelectedPlotData(plotData);
    setShowPlotInfo(true);
  };

  const handleClosePlotInfo = () => {
    setShowPlotInfo(false);
    setSelectedPlotData(null);
  };

  const handleOpenMailbox = (plotIdStr: string, ownerId: string | undefined, mailboxAddress?: string) => {
    if (!ownerId) {
      console.error('Owner ID is undefined, cannot open mailbox.');
      return;
    }
    // Convert string ID back to Id<'plots'> type - this assumes the plotIdStr is valid
    onOpenMailbox(plotIdStr as Id<'plots'>, ownerId, mailboxAddress);
  };
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas
        shadows
        camera={{ position: [0, 60, 120], fov: 60, far: 1000 }}
        style={{ width: '100vw', height: '100vh', background: '#b5e3b5' }}
        dpr={[1, 2]} // Responsive rendering for different device pixel ratios
      >
        {/* Fog to create depth and atmosphere */}
        {/* <fog attach="fog" args={['#a0c1e8', 300, 1500]} /> */}
        <Suspense fallback={null}>
          {/* Enhanced sky with more realistic Silicon Valley lighting */}
          <Sky 
            distance={250000} 
            sunPosition={[100, 40, 100]} 
            inclination={0.6}
            azimuth={0.2}
            rayleigh={0.8}
            turbidity={10}
          />
          
          {/* Ambient light for general illumination */}
          <ambientLight intensity={0.5} color="#E0F7FF" />
          
          {/* Main directional light (California sun) */}
          {/* <LightWithHelper /> */}
          
          {/* Secondary fill light */}
          <directionalLight
            position={[-30, 20, -10]}
            intensity={0.4}
            color="#FFF8E0"
          />
          

          
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
          <City 
            onPlotSelect={onPlotSelect} 
            onGovernmentBuildingClick={() => setIsGovernmentModalOpen(true)}
            showLandSelector={showLandSelector}
            onLandSelectorClose={() => setShowLandSelector(false)}
            onShowPlotInfo={handleShowPlotInfo}
            onOpenMailbox={handleOpenMailbox}
          />
          
          {/* Enhanced camera controls with zoom-to-cursor */}
          <OrbitControls 
            enableZoom={true} 
            enablePan={true} 
            minPolarAngle={0.2} 
            maxPolarAngle={Math.PI / 2.1} 
            minDistance={15}
            maxDistance={700}
            enableDamping={true}
            dampingFactor={0.05}
            zoomToCursor={true}
            screenSpacePanning={false}
            maxZoom={10}
            minZoom={0.5}
          />
          
          {/* Environment map for realistic reflections */}
          <Environment preset="city" background={false} />
          

        </Suspense>
      </Canvas>
      
      <GovernmentHelpModal 
        isOpen={isGovernmentModalOpen} 
        onClose={() => setIsGovernmentModalOpen(false)}
        onChoosePlot={handleChoosePlot}
      />

      {selectedPlotData && (
        <PlotInfo
          isOpen={showPlotInfo}
          onClose={handleClosePlotInfo}
          buildingInfo={{
            type: selectedPlotData.mainBuilding.type,
            height: selectedPlotData.mainBuilding.height,
            address: selectedPlotData.address,
            companyInfo: selectedPlotData.companyInfo,
            userId: selectedPlotData.userId,
            plotId: selectedPlotData._id.toString(),
            mailbox: selectedPlotData.mailbox
          }}
          currentUserId={currentUserId}
          onOpenMailbox={handleOpenMailbox}
        />
      )}
    </div>
  );
}