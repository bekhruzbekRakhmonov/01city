'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Plot } from './Plot';
import { Box, Text } from '@react-three/drei';
import { Ground } from './Ground';
import { PlotCreator } from '../ui/PlotCreator';
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
      
      {/* Roads */}
      <group>
        {/* Main roads */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.05, 0]} 
          receiveShadow
        >
          <planeGeometry args={[100, 8]} />
          <meshStandardMaterial color="#333333" roughness={0.7} />
        </mesh>
        
        {/* Road markings */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.04, 0]} 
          receiveShadow
        >
          <planeGeometry args={[100, 0.3]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
        </mesh>
      </group>
      
      {/* Silicon Valley Infrastructure */}
      <group>
        {/* Bike Lanes */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.05, 5]} 
          receiveShadow
        >
          <planeGeometry args={[100, 1.5]} />
          <meshStandardMaterial color="#4CAF50" roughness={0.7} />
        </mesh>
        
        {/* EV Charging Stations */}
        {[-30, -20, -10, 0, 10, 20, 30].map((x, index) => (
          <group key={`charging-station-${index}`} position={[x, 0, 4]}>
            <Box args={[1, 1.2, 0.5]} position={[0, 0.6, 0]} castShadow>
              <meshStandardMaterial color="#FFFFFF" />
            </Box>
            <Box args={[0.2, 0.2, 0.2]} position={[0, 1.3, 0.3]} castShadow>
              <meshStandardMaterial color="#4CAF50" emissive="#4CAF50" emissiveIntensity={0.5} />
            </Box>
          </group>
        ))}
        
        {/* Tech Shuttle Stops */}
        {[-25, -15, -5, 5, 15, 25].map((x, index) => (
          <group key={`shuttle-stop-${index}`} position={[x, 0, -4]}>
            <Box args={[3, 2.5, 0.5]} position={[0, 1.25, 0]} castShadow>
              <meshStandardMaterial color="#90CAF9" transparent opacity={0.7} />
            </Box>
            <Box args={[0.2, 2.5, 0.2]} position={[-1.4, 1.25, 0]} castShadow>
              <meshStandardMaterial color="#1976D2" />
            </Box>
            <Box args={[0.2, 2.5, 0.2]} position={[1.4, 1.25, 0]} castShadow>
              <meshStandardMaterial color="#1976D2" />
            </Box>
            <Box args={[3, 0.2, 0.5]} position={[0, 2.5, 0]} castShadow>
              <meshStandardMaterial color="#1976D2" />
            </Box>
          </group>
        ))}
      </group>
      
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