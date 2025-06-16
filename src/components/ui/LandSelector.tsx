import { useState, useRef, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Text } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LandSelectorProps {
  onPlotSelect: (position: { x: number; z: number }) => void;
  onCancel: () => void;
}

export function LandSelector({ onPlotSelect, onCancel }: LandSelectorProps) {
  const plots = useQuery(api.plots.getAll) || [];
  const userInfo = useQuery(api.users.getCurrentUser);
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; z: number } | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; z: number } | null>(null);
  const { camera, gl, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  
  // Define city boundaries and plot size
  const cityRadius = 650; // City boundary radius
  const plotSize = 10; // Size of each plot
  const minDistanceFromCenter = 20; // Minimum distance from government building
  const minDistanceBetweenPlots = 12; // Minimum distance between plots

  // Update cursor position using raycasting
  useFrame(() => {
    raycaster.current.setFromCamera(mouse.current, camera);
    
    // Create a ground plane for intersection
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectionPoint = new THREE.Vector3();
    
    if (raycaster.current.ray.intersectPlane(groundPlane, intersectionPoint)) {
      // Round to nearest 0.5 for smoother positioning
      const roundedX = Math.round(intersectionPoint.x * 2) / 2;
      const roundedZ = Math.round(intersectionPoint.z * 2) / 2;
      
      // Check if within city bounds
      const distanceFromCenter = Math.sqrt(roundedX * roundedX + roundedZ * roundedZ);
      if (distanceFromCenter <= cityRadius) {
        setCursorPosition({ x: roundedX, z: roundedZ });
      } else {
        setCursorPosition(null);
      }
    }
  });
  
  // Check if cursor position is available
  const isCursorPositionAvailable = cursorPosition && (() => {
    const { x, z } = cursorPosition;
    
    // Check distance from center (government building)
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    if (distanceFromCenter < minDistanceFromCenter) return false;
    
    // Check distance from existing plots
    const tooCloseToExisting = plots.some(plot => {
      const distance = Math.sqrt(
        Math.pow(plot.position.x - x, 2) + Math.pow(plot.position.z - z, 2)
      );
      return distance < minDistanceBetweenPlots;
    });
    
    return !tooCloseToExisting;
  })();
  
  const isCursorPositionOccupied = cursorPosition && !isCursorPositionAvailable && (() => {
    const { x, z } = cursorPosition;
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    
    // It's occupied if too close to center or existing plots
    return distanceFromCenter < minDistanceFromCenter || plots.some(plot => {
      const distance = Math.sqrt(
        Math.pow(plot.position.x - x, 2) + Math.pow(plot.position.z - z, 2)
      );
      return distance < minDistanceBetweenPlots;
    });
  })();

  // Mouse tracking and raycasting
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleDoubleClick = (event: MouseEvent) => {
      if (cursorPosition && isCursorPositionAvailable) {
        onPlotSelect({ x: cursorPosition.x, z: cursorPosition.z });
      }
    };

    gl.domElement.addEventListener('mousemove', handleMouseMove);
    gl.domElement.addEventListener('dblclick', handleDoubleClick);
    
    return () => {
      gl.domElement.removeEventListener('mousemove', handleMouseMove);
      gl.domElement.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [gl, cursorPosition, isCursorPositionAvailable, onPlotSelect]);
  
  return (
    <group>
      {/* Background overlay */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1000, 1000]} />
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
      
      {/* City boundary indicator */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[cityRadius - 2, cityRadius, 64]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.3} />
      </mesh>
      
      {/* Government building exclusion zone */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[minDistanceFromCenter, 32]} />
        <meshStandardMaterial color="#ef4444" transparent opacity={0.2} />
      </mesh>
      
      {/* Cursor follower - main selection indicator */}
      {cursorPosition && (
        <group position={[cursorPosition.x, 0.3, cursorPosition.z]}>
          {/* Plot ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[plotSize, plotSize]} />
            <meshStandardMaterial 
              color={isCursorPositionAvailable ? "#22c55e" : isCursorPositionOccupied ? "#ef4444" : "#6b7280"} 
              transparent 
              opacity={0.8}
            />
          </mesh>
          
          {/* Plot border */}
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(plotSize, plotSize)]} />
            <lineBasicMaterial color="#ffffff" linewidth={2} />
          </lineSegments>
          
          {/* Status indicator */}
          <Text
            position={[0, 0.1, 0]}
            fontSize={0.5}
            color="white"
            anchorX="center"
            anchorY="middle"
            rotation={[-Math.PI / 2, 0, 0]}
          >
            {isCursorPositionAvailable ? "AVAILABLE" : isCursorPositionOccupied ? "OCCUPIED" : "INVALID"}
          </Text>
          
          {/* Info panel */}
          <group position={[0, 3, 0]}>
            <mesh position={[0, 0, -0.1]}>
              <planeGeometry args={[8, 2.5]} />
              <meshStandardMaterial color="#1f2937" opacity={0.9} transparent />
            </mesh>
            <Text
              position={[0, 0.5, 0]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              Position: ({cursorPosition.x}, {cursorPosition.z})
            </Text>
            <Text
              position={[0, 0, 0]}
              fontSize={0.25}
              color={isCursorPositionAvailable ? "#22c55e" : isCursorPositionOccupied ? "#ef4444" : "#6b7280"}
              anchorX="center"
              anchorY="middle"
            >
              {isCursorPositionAvailable ? "Double-click to select this plot" : 
               isCursorPositionOccupied ? "This plot is already taken" : 
               "Move cursor to an available area"}
            </Text>
            {isCursorPositionAvailable && (
              <Text
                position={[0, -0.5, 0]}
                fontSize={0.2}
                color="#9ca3af"
                anchorX="center"
                anchorY="middle"
              >
                Cost: 1 Credit
              </Text>
            )}
          </group>
        </group>
      )}
      
      {/* Existing plots with exclusion zones */}
      {plots.map((plot, index) => (
        <group key={`existing-${index}`} position={[plot.position.x, 0.1, plot.position.z]}>
          {/* Plot area */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[plotSize, plotSize]} />
            <meshStandardMaterial color="#ef4444" transparent opacity={0.4} />
          </mesh>
          
          {/* Exclusion zone around plot */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[plotSize / 2, minDistanceBetweenPlots / 2, 16]} />
            <meshStandardMaterial color="#ef4444" transparent opacity={0.1} />
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
        
        {/* City boundary indicator */}
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
            City Boundary
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
        
        {/* Cursor indicator */}
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
            Cursor Selection
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
          Move your cursor anywhere in the city to place a plot
        </Text>
        <Text
          position={[0, -0.3, 0]}
          fontSize={0.25}
          color="#9ca3af"
          anchorX="center"
          anchorY="middle"
        >
          Avoid red zones and double-click when highlighted green
        </Text>
      </group>
    </group>
  );
}

export default LandSelector;