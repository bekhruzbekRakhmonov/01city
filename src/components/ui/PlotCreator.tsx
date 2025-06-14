'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface PlotCreatorProps {
  initialPosition: { x: number; z: number };
  onComplete?: () => void;
}

export function PlotCreator({ initialPosition, onComplete }: PlotCreatorProps) {
  const [step, setStep] = useState(1); // 1: Building Type, 2: Customization, 3: Garden, 4: Info
  const { user } = useUser();
  const createPlot = useMutation(api.plots.create);
  
  // Use the provided initial position
  const [position] = useState(initialPosition);
  
  // Main building configuration
  const [mainBuilding, setMainBuilding] = useState({
    type: 'house',
    height: 5,
    color: '#4A90E2',
    rotation: 0,
  });
  
  // Garden configuration
  const [garden, setGarden] = useState({
    enabled: true,
    style: 'simple',
    elements: ['tree', 'bush', 'flower'],
  });
  
  // Sub-buildings configuration
  const [subBuildings, setSubBuildings] = useState<any[]>([]);
  const [showSubBuildingForm, setShowSubBuildingForm] = useState(false);
  const [currentSubBuilding, setCurrentSubBuilding] = useState({
    type: 'cafe',
    position: { x: 3, z: 3 },
    rotation: 0,
    size: 1,
    color: '#E24A90',
  });
  
  // Plot information
  const [description, setDescription] = useState('');
  const [creatorInfo, setCreatorInfo] = useState('');
  
  // Building types
  const buildingTypes = ['house', 'skyscraper', 'shop', 'tower', 'techCampus', 'startupOffice', 'dataCenter'];
  const subBuildingTypes = ['cafe', 'studio', 'gallery', 'gazebo', 'fountain', 'techLounge', 'bikeStation', 'innovationLab'];
  
  // Garden elements
  const gardenElements = ['tree', 'bush', 'flower', 'rock', 'pond', 'solarPanel', 'sculpture'];
  
  // Add a sub-building
  const addSubBuilding = () => {
    setSubBuildings([...subBuildings, { ...currentSubBuilding }]);
    setShowSubBuildingForm(false);
    setCurrentSubBuilding({
      type: 'cafe',
      position: { x: 3, z: 3 },
      rotation: 0,
      size: 1,
      color: '#E24A90',
    });
  };
  
  // Remove a sub-building
  const removeSubBuilding = (index: number) => {
    const newSubBuildings = [...subBuildings];
    newSubBuildings.splice(index, 1);
    setSubBuildings(newSubBuildings);
  };
  
  // Handle garden elements
  const toggleGardenElement = (element: string) => {
    if (garden.elements.includes(element)) {
      setGarden({
        ...garden,
        elements: garden.elements.filter(e => e !== element),
      });
    } else {
      setGarden({
        ...garden,
        elements: [...garden.elements, element],
      });
    }
  };
  
  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Submit the plot
  const handleSubmit = async () => {
    if (!user) return;
    
    try {
      await createPlot({
        userId: user.id,
        username: user.username || user.firstName || 'Anonymous',
        position,
        size: { width: 10, depth: 10 }, // Fixed size for simplicity
        mainBuilding,
        garden: garden.enabled ? garden : undefined,
        subBuildings: subBuildings.length > 0 ? subBuildings : undefined,
        description,
        creatorInfo,
      });
      
      // Reset form or navigate away
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error creating plot:', error);
    }
  };
  
  return (
    <group position={[0, 5, 0]}>
      {/* Background panel */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#1f2937" opacity={0.9} transparent />
      </mesh>

      {/* Title */}
      <Text
        position={[0, 3, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Create Your Plot
      </Text>

      {step === 1 && (
        <group>
          <Text
            position={[0, 2, 0]}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            Choose Building Type
          </Text>
          
          {/* Building type options */}
          <group position={[0, 0, 0]}>
            {buildingTypes.map((type, index) => {
              const row = Math.floor(index / 3);
              const col = index % 3;
              const x = (col - 1) * 2.5;
              const y = 1 - row * 1.5;
              
              return (
                <group key={type} position={[x, y, 0]} onClick={() => {
                  setMainBuilding({ ...mainBuilding, type });
                  handleNext();
                }}>
                  <mesh>
                    <planeGeometry args={[2, 1]} />
                    <meshStandardMaterial 
                      color={mainBuilding.type === type ? "#3b82f6" : "#4b5563"} 
                    />
                  </mesh>
                  <Text
                    position={[0, 0, 0.1]}
                    fontSize={0.2}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                  >
                    {type}
                  </Text>
                </group>
              );
            })}
          </group>
        </group>
      )}
      
      {step === 2 && (
          <group>
            <Text
              position={[0, 2, 0]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              Customize Building
            </Text>

            {/* Height control */}
            <group position={[-3, 0.5, 0]}>
              <Text position={[0, 0.5, 0]} fontSize={0.2} color="white" anchorX="center">
                Height
              </Text>
              <group position={[0, 0, 0]}>
                <mesh 
                  position={[-0.5, 0, 0]} 
                  onClick={() => setMainBuilding({ ...mainBuilding, height: Math.max(3, mainBuilding.height - 1) })}
                >
                  <planeGeometry args={[0.5, 0.5]} />
                  <meshStandardMaterial color="#4b5563" />
                </mesh>
                <Text position={[0, 0, 0]} fontSize={0.2} color="white" anchorX="center">
                  {mainBuilding.height}
                </Text>
                <mesh 
                  position={[0.5, 0, 0]} 
                  onClick={() => setMainBuilding({ ...mainBuilding, height: Math.min(20, mainBuilding.height + 1) })}
                >
                  <planeGeometry args={[0.5, 0.5]} />
                  <meshStandardMaterial color="#4b5563" />
                </mesh>
              </group>
            </group>

            {/* Color selection */}
            <group position={[0, 0.5, 0]}>
              <Text position={[0, 0.5, 0]} fontSize={0.2} color="white" anchorX="center">
                Color
              </Text>
              <group position={[0, 0, 0]}>
                {['#4A90E2', '#E24A90', '#4AE290', '#E2904A'].map((color, i) => (
                  <mesh
                    key={color}
                    position={[(i - 1.5) * 0.6, 0, 0]}
                    onClick={() => setMainBuilding({ ...mainBuilding, color })}
                  >
                    <planeGeometry args={[0.5, 0.5]} />
                    <meshStandardMaterial color={color} />
                  </mesh>
                ))}
              </group>
            </group>

            {/* Rotation control */}
            <group position={[3, 0.5, 0]}>
              <Text position={[0, 0.5, 0]} fontSize={0.2} color="white" anchorX="center">
                Rotation
              </Text>
              <group position={[0, 0, 0]}>
                <mesh 
                  position={[-0.5, 0, 0]} 
                  onClick={() => setMainBuilding({ ...mainBuilding, rotation: (mainBuilding.rotation - Math.PI / 4) % (Math.PI * 2) })}
                >
                  <planeGeometry args={[0.5, 0.5]} />
                  <meshStandardMaterial color="#4b5563" />
                </mesh>
                <Text position={[0, 0, 0]} fontSize={0.2} color="white" anchorX="center">
                  {Math.round((mainBuilding.rotation * 180) / Math.PI)}°
                </Text>
                <mesh 
                  position={[0.5, 0, 0]} 
                  onClick={() => setMainBuilding({ ...mainBuilding, rotation: (mainBuilding.rotation + Math.PI / 4) % (Math.PI * 2) })}
                >
                  <planeGeometry args={[0.5, 0.5]} />
                  <meshStandardMaterial color="#4b5563" />
                </mesh>
              </group>
            </group>

            {/* Navigation buttons */}
            <group position={[0, -2, 0]}>
              <mesh position={[-2, 0, 0]} onClick={handleBack}>
                <planeGeometry args={[2, 0.8]} />
                <meshStandardMaterial color="#4b5563" />
              </mesh>
              <Text position={[-2, 0, 0.1]} fontSize={0.2} color="white" anchorX="center">
                Back
              </Text>

              <mesh position={[2, 0, 0]} onClick={handleNext}>
                <planeGeometry args={[2, 0.8]} />
                <meshStandardMaterial color="#3b82f6" />
              </mesh>
              <Text position={[2, 0, 0.1]} fontSize={0.2} color="white" anchorX="center">
                Next
              </Text>
            </group>
          </group>
        )}
        {step === 3 && (
          <group>
            <Text
              position={[0, 2, 0]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              Garden Design
            </Text>

            {/* Garden toggle */}
            <group position={[0, 1, 0]}>
              <mesh 
                onClick={() => setGarden({ ...garden, enabled: !garden.enabled })}
              >
                <planeGeometry args={[4, 0.8]} />
                <meshStandardMaterial color={garden.enabled ? "#3b82f6" : "#4b5563"} />
              </mesh>
              <Text position={[0, 0, 0.1]} fontSize={0.2} color="white" anchorX="center">
                {garden.enabled ? "Garden Enabled" : "Garden Disabled"}
              </Text>
            </group>

            {/* Garden elements */}
            {garden.enabled && (
              <group position={[0, 0, 0]}>
                <Text position={[0, 0.5, 0]} fontSize={0.2} color="white" anchorX="center">
                  Elements
                </Text>
                <group position={[0, -0.5, 0]}>
                  {gardenElements.map((element, index) => {
                    const row = Math.floor(index / 4);
                    const col = index % 4;
                    const x = (col - 1.5) * 2;
                    const y = -row * 1;
                    
                    return (
                      <group key={element} position={[x, y, 0]}>
                        <mesh
                          onClick={() => toggleGardenElement(element)}
                        >
                          <planeGeometry args={[1.8, 0.8]} />
                          <meshStandardMaterial 
                            color={garden.elements.includes(element) ? "#3b82f6" : "#4b5563"} 
                          />
                        </mesh>
                        <Text position={[0, 0, 0.1]} fontSize={0.2} color="white" anchorX="center">
                          {element}
                        </Text>
                      </group>
                    );
                  })}
                </group>
              </group>
            )}

            {/* Navigation buttons */}
            <group position={[0, -2, 0]}>
              <mesh position={[-2, 0, 0]} onClick={handleBack}>
                <planeGeometry args={[2, 0.8]} />
                <meshStandardMaterial color="#4b5563" />
              </mesh>
              <Text position={[-2, 0, 0.1]} fontSize={0.2} color="white" anchorX="center">
                Back
              </Text>

              <mesh position={[2, 0, 0]} onClick={handleNext}>
                <planeGeometry args={[2, 0.8]} />
                <meshStandardMaterial color="#3b82f6" />
              </mesh>
              <Text position={[2, 0, 0.1]} fontSize={0.2} color="white" anchorX="center">
                Next
              </Text>
            </group>
          </group>
        )}
          {step === 4 && (
          <group>
            <Text
              position={[0, 2, 0]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              Plot Information
            </Text>

            {/* Description input */}
            <group position={[0, 0.5, 0]}>
              <Text position={[0, 0.5, 0]} fontSize={0.2} color="white" anchorX="center">
                Description
              </Text>
              <mesh onClick={() => {
                const input = prompt('Enter plot description:');
                if (input) setDescription(input);
              }}>
                <planeGeometry args={[8, 1]} />
                <meshStandardMaterial color="#4b5563" />
              </mesh>
              <Text 
                position={[0, 0, 0.1]} 
                fontSize={0.15} 
                color="white" 
                anchorX="center"
                maxWidth={7.5}
              >
                {description || 'Click to add description'}
              </Text>
            </group>

            {/* Creator info input */}
            <group position={[0, -1, 0]}>
              <Text position={[0, 0.5, 0]} fontSize={0.2} color="white" anchorX="center">
                Creator Info
              </Text>
              <mesh onClick={() => {
                const input = prompt('Enter creator info:');
                if (input) setCreatorInfo(input);
              }}>
                <planeGeometry args={[8, 1]} />
                <meshStandardMaterial color="#4b5563" />
              </mesh>
              <Text 
                position={[0, 0, 0.1]} 
                fontSize={0.15} 
                color="white" 
                anchorX="center"
                maxWidth={7.5}
              >
                {creatorInfo || 'Click to add creator info'}
              </Text>
            </group>

            {/* Navigation buttons */}
            <group position={[0, -2.5, 0]}>
              <mesh position={[-2, 0, 0]} onClick={handleBack}>
                <planeGeometry args={[2, 0.8]} />
                <meshStandardMaterial color="#4b5563" />
              </mesh>
              <Text position={[-2, 0, 0.1]} fontSize={0.2} color="white" anchorX="center">
                Back
              </Text>

              <mesh position={[2, 0, 0]} onClick={handleSubmit}>
                <planeGeometry args={[2, 0.8]} />
                <meshStandardMaterial color="#22c55e" />
              </mesh>
              <Text position={[2, 0, 0.1]} fontSize={0.2} color="white" anchorX="center">
                Create Plot
              </Text>
            </group>
          </group>
        )}
          
      </group>
  );
}