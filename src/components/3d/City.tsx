'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Plot } from './Plot';
import LandSelector from '../ui/LandSelector';
import { Text } from '@react-three/drei';
import { Ground } from './Ground';
import { GovernmentBuilding } from './GovernmentBuilding';
import { useUser } from '@clerk/nextjs';

interface CityProps {
  onPlotSelect: (position: { x: number; z: number }) => void;
  onGovernmentBuildingClick?: () => void;
  showLandSelector?: boolean;
  onLandSelectorClose?: () => void;
}

export function City({ onPlotSelect, onGovernmentBuildingClick, showLandSelector = false, onLandSelectorClose }: CityProps) {
  // Fetch all plots from Convex
  const plots = useQuery(api.plots.getAll) || [];
  const [isChoosingPlot, setIsChoosingPlot] = useState(false);
  const { isSignedIn } = useUser();

  const handlePlotSelect = (position: { x: number; z: number }) => {
    onPlotSelect(position);
    setIsChoosingPlot(false);
    if (onLandSelectorClose) {
      onLandSelectorClose();
    }
  };

  const handleLandSelectorCancel = () => {
    if (onLandSelectorClose) {
      onLandSelectorClose();
    }
    setIsChoosingPlot(false);
  };

  return (
    <group>
      {/* Ground */}
      <Ground />
      <GovernmentBuilding 
        position={[0, 0, 0]} 
        scale={1} 
        onBuildingClick={onGovernmentBuildingClick}
      />
      
      {/* Existing Plots */}
      {plots.map((plot) => (
        <Plot key={plot._id} plot={plot} />
      ))}

      {/* Choose Plot Button - Only show to signed-in users when land selector is not controlled externally */}
      {!isChoosingPlot && !showLandSelector && isSignedIn && !onLandSelectorClose && (
        <group position={[0, 10, 0]} onClick={() => setIsChoosingPlot(true)}>
          <mesh>
            <boxGeometry args={[8, 2, 1]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
          <Text
            position={[0, 0, 0.6]}
            fontSize={0.5}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            Choose Plot
          </Text>
        </group>
      )}

      {/* Sign In Prompt for non-authenticated users */}
      {!isChoosingPlot && !showLandSelector && !isSignedIn && (
        <group position={[0, 10, 0]}>
          <mesh>
            <boxGeometry args={[12, 2, 1]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>
          <Text
            position={[0, 0, 0.6]}
            fontSize={0.4}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            Sign in to build your plot
          </Text>
        </group>
      )}

      {/* Land Selector */}
      {showLandSelector && (
        <LandSelector
          onPlotSelect={handlePlotSelect}
          onCancel={handleLandSelectorCancel}
        />
      )}
    </group>
  );
};

export default City;