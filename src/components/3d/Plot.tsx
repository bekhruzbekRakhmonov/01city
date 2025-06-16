'use client';

import { useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Building } from './Building';
import { Garden } from './Garden';
import { SubBuilding } from './SubBuilding';
import { PlotInfo } from '../ui/PlotInfo';

interface PlotProps {
  plot: any; // Using 'any' for now, would be properly typed in a real implementation
  isSelectable?: boolean;
  onSelect?: () => void;
}

export function Plot({ plot, isSelectable = false, onSelect }: PlotProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { camera } = useThree();
  
  // Plot boundaries visualization
  const plotWidth = plot.size.width;
  const plotDepth = plot.size.depth;
  
  const handlePlotClick = () => {
    if (isSelectable && onSelect) {
      onSelect();
    } else {
      setShowInfo(!showInfo);
    }
  };

  const handlePointerOver = () => {
    if (isSelectable) {
      setIsHovered(true);
    }
  };

  const handlePointerOut = () => {
    if (isSelectable) {
      setIsHovered(false);
    }
  };
  
  console.log(plot);
  return (
    <group 
      position={[plot.position.x, 0, plot.position.z]}
      onClick={handlePlotClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Plot boundaries - slightly transparent ground */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[plotWidth, plotDepth]} />
        <meshStandardMaterial 
          color={isHovered ? "#4CAF50" : "#f0f0f0"} 
          transparent 
          opacity={isHovered ? 0.5 : 0.3} 
        />
      </mesh>
      
      {/* Main building */}
      <Building 
        type={plot.mainBuilding.type}
        position={[0, 0, 0]}
        height={plot.mainBuilding.height}
        color={plot.mainBuilding.color}
        rotation={plot.mainBuilding.rotation || 0}
        customizations={plot.mainBuilding.customizations}
        selectedModel={plot.mainBuilding.customizations.selectedModel}
        plotId={plot._id}
        advertising={plot.advertising}
      />
      
      {/* Garden if enabled */}
      {plot.garden && plot.garden.enabled && (
        <Garden 
          style={plot.garden.style}
          elements={plot.garden.elements}
          plotSize={{ width: plotWidth, depth: plotDepth }}
        />
      )}
      
      {/* Sub-buildings if any */}
      {plot.subBuildings && plot.subBuildings.map((subBuilding: any, index: number) => (
        <SubBuilding 
          key={index}
          type={subBuilding.type}
          position={[subBuilding.position.x, 0, subBuilding.position.z]}
          rotation={[0, subBuilding.rotation || 0, 0]}
          size={subBuilding.size}
          color={subBuilding.color}
          customizations={subBuilding.customizations}
        />
      ))}
      
      {/* Info popup when clicked */}
      {showInfo && (
        <Html
          position={[0, plot.mainBuilding.height + 2, 0]}
          distanceFactor={10}
          occlude
        >
          <PlotInfo 
            username={plot.username}
            description={plot.description || "No description provided"}
            creatorInfo={plot.creatorInfo || ""}
            onClose={() => setShowInfo(false)}
          />
        </Html>
      )}
    </group>
  );
}