'use client';

import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Plot } from './Plot';
import { PlotCreator } from '../ui/PlotCreator';
import LandSelector from '../ui/LandSelector';
import { Text } from '@react-three/drei';
import { Ground } from './Ground';
import { GovernmentBuilding } from './GovernmentBuilding';
import { useUser } from '@clerk/nextjs';
import * as THREE from 'three';

export function City() {
  // Fetch all plots from Convex
  const plots = useQuery(api.plots.getAll) || [];
  const [isCreatingPlot, setIsCreatingPlot] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{ x: number; z: number } | null>(null);
  const [isChoosingPlot, setIsChoosingPlot] = useState(false);
  const [showLandSelector, setShowLandSelector] = useState(false);
  const { isSignedIn } = useUser();

  // Generate available plot positions
  const availablePositions = Array.from({ length: 20 }, (_, i) => ({
    x: (i % 5) * 15 - 30,
    z: Math.floor(i / 5) * 15 - 30
  })).filter(pos => 
    !plots.some(plot => 
      plot.position.x === pos.x && plot.position.z === pos.z
    )
  );

  const handlePlotSelect = (position: { x: number; z: number }) => {
    setSelectedPosition(position);
    setIsCreatingPlot(true);
    setIsChoosingPlot(false);
    setShowLandSelector(false);
  };

  const handleLandSelectorCancel = () => {
    setShowLandSelector(false);
    setIsChoosingPlot(false);
  };

  const handlePlotCreated = () => {
    setIsCreatingPlot(false);
    setSelectedPosition(null);
    setShowLandSelector(false);
  };

  return (
    <group>
      {/* Ground */}
      <Ground />
      <GovernmentBuilding position={[0, 0, 0]} scale={1} />
      
      {/* Existing Plots */}
      {plots.map((plot) => (
        <Plot key={plot._id} plot={plot} />
      ))}



      {/* Plot Creator Modal */}
      {isCreatingPlot && selectedPosition && (
        <PlotCreator
          initialPosition={selectedPosition}
          onComplete={handlePlotCreated}
        />
      )}

      {/* Choose Plot Button */}
      {!isCreatingPlot && !isChoosingPlot && !showLandSelector && (
        <group position={[0, 10, 0]} onClick={() => setShowLandSelector(true)}>
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