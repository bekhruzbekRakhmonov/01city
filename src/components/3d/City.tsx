'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Plot } from './Plot';
import { Box, Text } from '@react-three/drei';
import { Ground } from './Ground';
import { PlotCreator } from '../ui/PlotCreator';
import { GovernmentBuilding } from './GovernmentBuilding';
import { useUser } from '@clerk/nextjs';
import * as THREE from 'three';

export function City() {
  // Fetch all plots from Convex
  const plots = useQuery(api.plots.getAll) || [];
  const [isSelectingPlot, setIsSelectingPlot] = useState(false);
  const [showPlotCreator, setShowPlotCreator] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{ x: number; z: number } | null>(null);
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
    setShowPlotCreator(true);
    setIsSelectingPlot(false);
  };

  const handlePlotCreated = () => {
    setShowPlotCreator(false);
    setSelectedPosition(null);
  };

  return (
    <group>
      {/* Ground */}
      <Ground />
      <GovernmentBuilding position={[0, 0, 0]} scale={0.4} />
      
      {/* Existing Plots */}
      {plots.map((plot) => (
        <Plot key={plot._id} plot={plot} />
      ))}

      {/* Available Plot Positions */}
      {isSelectingPlot && availablePositions.map((position, index) => (
        <Plot
          key={`available-${index}`}
          plot={{
            position,
            size: { width: 10, depth: 10 },
            mainBuilding: { height: 0 }
          }}
          isSelectable
          onSelect={() => handlePlotSelect(position)}
        />
      ))}

      {/* Plot Creator Modal */}
      {showPlotCreator && selectedPosition && (
        <PlotCreator
          initialPosition={selectedPosition}
          onComplete={handlePlotCreated}
        />
      )}

      {/* Build Button */}
      {isSignedIn && !isSelectingPlot && !showPlotCreator && (
        <group position={[0, 2, 0]} onClick={() => setIsSelectingPlot(true)}>
          <mesh>
            <planeGeometry args={[4, 1]} />
            <meshStandardMaterial color="#2563eb" />
          </mesh>
          <Text
            position={[0, 0, 0.1]}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            Choose Plot
          </Text>
        </group>
      )}
    </group>
  );
};

export default City;