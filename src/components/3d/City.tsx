'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Plot } from './Plot';
import { Box } from '@react-three/drei';

export function City() {
  // Fetch all plots from Convex
  const plots = useQuery(api.plots.getAll) || [];

  return (
    <group>
      {/* Ground */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.1, 0]} 
        receiveShadow
      >
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#8BA446" roughness={0.8} />
      </mesh>
      
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
        <mesh 
          rotation={[-Math.PI / 2, Math.PI / 2, 0]} 
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
        <mesh 
          rotation={[-Math.PI / 2, Math.PI / 2, 0]} 
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
        <mesh 
          rotation={[-Math.PI / 2, Math.PI / 2, 0]} 
          position={[5, -0.05, 0]} 
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
      
      {/* Plots */}
      {plots.map((plot) => (
        <Plot key={plot._id} plot={plot} />
      ))}
    </group>
  );
};

export default City;