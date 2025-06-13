import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface LandSelectorProps {
  onPlotSelect: (position: { x: number; z: number }) => void;
  onCancel: () => void;
}

export function LandSelector({ onPlotSelect, onCancel }: LandSelectorProps) {
  const plots = useQuery(api.plots.getAll) || [];
  const userInfo = useQuery(api.users.getCurrentUser);
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; z: number } | null>(null);
  
  // Generate grid of available positions
  const gridSize = 10; // 10x10 grid
  const plotSpacing = 15;
  const centerOffset = (gridSize - 1) * plotSpacing / 2;
  
  const allPositions = Array.from({ length: gridSize * gridSize }, (_, i) => {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    return {
      x: col * plotSpacing - centerOffset,
      z: row * plotSpacing - centerOffset,
      index: i
    };
  });
  
  // Filter out occupied positions
  const availablePositions = allPositions.filter(pos => 
    !plots.some(plot => 
      Math.abs(plot.position.x - pos.x) < 5 && Math.abs(plot.position.z - pos.z) < 5
    )
  );
  
  // Get occupied positions for visualization
  const occupiedPositions = allPositions.filter(pos => 
    plots.some(plot => 
      Math.abs(plot.position.x - pos.x) < 5 && Math.abs(plot.position.z - pos.z) < 5
    )
  );
  
  const handlePlotHover = (position: { x: number; z: number } | null) => {
    setHoveredPosition(position);
  };
  
  const handlePlotClick = (position: { x: number; z: number }) => {
    onPlotSelect(position);
  };
  
  return (
    <group>
      {/* Background overlay */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#000000" opacity={0.3} transparent />
      </mesh>
      
      {/* Title */}
      <group position={[0, 10, 0]}>
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[12, 3]} />
          <meshStandardMaterial color="#1f2937" opacity={0.9} transparent />
        </mesh>
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.8}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Choose Your Land
        </Text>
        <Text
          position={[0, -0.3, 0]}
          fontSize={0.3}
          color="#9ca3af"
          anchorX="center"
          anchorY="middle"
        >
          Available Credits: {userInfo?.freeSquares || 0}
        </Text>
      </group>
      
      {/* Available plots */}
      {availablePositions.map((position, index) => {
        const isHovered = hoveredPosition && 
          hoveredPosition.x === position.x && hoveredPosition.z === position.z;
        
        return (
          <group
            key={`available-${index}`}
            position={[position.x, 0.2, position.z]}
            onClick={() => handlePlotClick(position)}
            onPointerOver={() => handlePlotHover(position)}
            onPointerOut={() => handlePlotHover(null)}
          >
            {/* Plot ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[10, 10]} />
              <meshStandardMaterial 
                color={isHovered ? "#22c55e" : "#3b82f6"} 
                transparent 
                opacity={isHovered ? 0.8 : 0.6}
              />
            </mesh>
            
            {/* Plot border */}
            <lineSegments>
              <edgesGeometry args={[new THREE.PlaneGeometry(10, 10)]} />
              <lineBasicMaterial color={isHovered ? "#ffffff" : "#60a5fa"} />
            </lineSegments>
            
            {/* Available indicator */}
            <Text
              position={[0, 0.1, 0]}
              fontSize={0.5}
              color="white"
              anchorX="center"
              anchorY="middle"
              rotation={[-Math.PI / 2, 0, 0]}
            >
              AVAILABLE
            </Text>
            
            {/* Hover info */}
            {isHovered && (
              <group position={[0, 3, 0]}>
                <mesh position={[0, 0, -0.1]}>
                  <planeGeometry args={[6, 2]} />
                  <meshStandardMaterial color="#1f2937" opacity={0.9} transparent />
                </mesh>
                <Text
                  position={[0, 0.3, 0]}
                  fontSize={0.3}
                  color="white"
                  anchorX="center"
                  anchorY="middle"
                >
                  Plot {position.index + 1}
                </Text>
                <Text
                  position={[0, -0.1, 0]}
                  fontSize={0.2}
                  color="#9ca3af"
                  anchorX="center"
                  anchorY="middle"
                >
                  Position: ({position.x}, {position.z})
                </Text>
                <Text
                  position={[0, -0.4, 0]}
                  fontSize={0.2}
                  color="#22c55e"
                  anchorX="center"
                  anchorY="middle"
                >
                  Click to select
                </Text>
              </group>
            )}
          </group>
        );
      })}
      
      {/* Occupied plots */}
      {occupiedPositions.map((position, index) => (
        <group key={`occupied-${index}`} position={[position.x, 0.1, position.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color="#ef4444" transparent opacity={0.4} />
          </mesh>
          <Text
            position={[0, 0.1, 0]}
            fontSize={0.4}
            color="white"
            anchorX="center"
            anchorY="middle"
            rotation={[-Math.PI / 2, 0, 0]}
          >
            OCCUPIED
          </Text>
        </group>
      ))}
      
      {/* Legend */}
      <group position={[-60, 5, -60]}>
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[8, 4]} />
          <meshStandardMaterial color="#1f2937" opacity={0.9} transparent />
        </mesh>
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Legend
        </Text>
        
        {/* Available indicator */}
        <group position={[-2, 0.5, 0]}>
          <mesh>
            <planeGeometry args={[1, 0.5]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
          <Text
            position={[1.5, 0, 0.1]}
            fontSize={0.2}
            color="white"
            anchorX="left"
            anchorY="middle"
          >
            Available
          </Text>
        </group>
        
        {/* Occupied indicator */}
        <group position={[-2, -0.2, 0]}>
          <mesh>
            <planeGeometry args={[1, 0.5]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          <Text
            position={[1.5, 0, 0.1]}
            fontSize={0.2}
            color="white"
            anchorX="left"
            anchorY="middle"
          >
            Occupied
          </Text>
        </group>
        
        {/* Hovered indicator */}
        <group position={[-2, -0.9, 0]}>
          <mesh>
            <planeGeometry args={[1, 0.5]} />
            <meshStandardMaterial color="#22c55e" />
          </mesh>
          <Text
            position={[1.5, 0, 0.1]}
            fontSize={0.2}
            color="white"
            anchorX="left"
            anchorY="middle"
          >
            Hover/Select
          </Text>
        </group>
      </group>
      
      {/* Cancel button */}
      <group position={[60, 5, -60]} onClick={onCancel}>
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[4, 1.5]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <Text
          position={[0, 0, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Cancel
        </Text>
      </group>
      
      {/* Instructions */}
      <group position={[0, 2, 60]}>
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[16, 2]} />
          <meshStandardMaterial color="#1f2937" opacity={0.9} transparent />
        </mesh>
        <Text
          position={[0, 0.3, 0]}
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Hover over available plots to see details
        </Text>
        <Text
          position={[0, -0.3, 0]}
          fontSize={0.25}
          color="#9ca3af"
          anchorX="center"
          anchorY="middle"
        >
          Click on a blue plot to start building
        </Text>
      </group>
    </group>
  );
}

export default LandSelector;