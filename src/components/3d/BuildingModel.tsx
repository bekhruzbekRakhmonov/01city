'use client';

import { useGLTF, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { GLTF } from 'three-stdlib';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { getVisitorId, getSessionId, getUserAgent, getReferrer } from '../../utils/analytics';
import { Id } from '../../../convex/_generated/dataModel';

// Preload models
useGLTF.preload('/buildings3dmodel/low_poly_building.glb');
useGLTF.preload('/buildings3dmodel/sugarcube_corner.glb');

type BuildingType = 'low_poly' | 'sugarcube';

interface BuildingModelProps {
  modelType: BuildingType;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  selected?: boolean;
  height?: number;
  plotId?: string;
  companyInfo?: {
    companyName: string;
    website: string;
    logoSvg: string;
    shortDescription: string;
  };
  [key: string]: any; // For additional props
}

export function BuildingModel({
  modelType,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color,
  selected = false,
  height = 5,
  plotId,
  companyInfo,
  ...props
}: BuildingModelProps) {
  // Analytics mutation
  const recordWebsiteVisit = useMutation(api.analytics.recordWebsiteVisit);

  // Handle website visit tracking
  const handleWebsiteClick = async (websiteUrl: string) => {
    if (plotId) {
      try {
        await recordWebsiteVisit({
          plotId: plotId as Id<'plots'>,
          visitorId: getVisitorId(),
          sessionId: getSessionId(),
          websiteUrl,
          timestamp: Date.now(),
          userAgent: getUserAgent(),
          referrer: getReferrer()
        });
      } catch (error) {
        console.error('Failed to track website visit:', error);
      }
    }
    
    // Open the website
    window.open(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`, '_blank');
  };
  console.log("modelatype", modelType)
  console.log("companyInfo", companyInfo)
  const group = useRef<THREE.Group>(null);
  const modelPath = `/buildings3dmodel/${modelType === 'low_poly' ? 'low_poly_building' : 'sugarcube_corner'}.glb`;
  const { scene } = useGLTF(modelPath) as unknown as GLTF;

  // Use the provided height prop for the building's highest point
  const highestPoint = height * 6;

  // Clone the scene to avoid sharing materials between instances
  const model = useMemo(() => {
    const modelClone = scene.clone();

    // Apply color if provided
    if (color) {
      modelClone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = child.material.clone();
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.setStyle(color);
          }
        }
      });
    }

    return modelClone;
  }, [scene, color]);

  // Add hover/selection effect
  useFrame(() => {
    if (group.current) {
      if (selected) {
        group.current.scale.setScalar(scale * 1.05);
      } else {
        group.current.scale.setScalar(scale);
      }
    }
  });

  // Bubble message rendering function
  const renderBubbleMessage = () => {
    if (!companyInfo) {
      return null;
    }

    // Calculate bubble Y position above the highest point of the model, scaled
    const bubbleY = (highestPoint * scale) + 1.5;
    const bubbleScale = Math.max(30, Math.min(4, (highestPoint * scale) / 5));

    return (
      <Html
        position={[0, bubbleY, 0]}
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `scale(${bubbleScale})`,
          transformOrigin: 'bottom center',
          zIndex: 9999
        }}
        center
        distanceFactor={5}
      >
        <div className="bg-white rounded-xl p-8 shadow-2xl border-4 border-blue-500" style={{ width: '400px', minHeight: '200px' }}>
          <div className="flex items-center space-x-4">
            {companyInfo.logoSvg && (
              <div 
                className="w-20 h-20 bg-white rounded-lg flex-shrink-0 flex items-center justify-center border-2 border-gray-200"
                dangerouslySetInnerHTML={{ __html: companyInfo.logoSvg }}
              />
            )}
            <div className="flex-1">
              <div className="text-blue-600 font-bold text-2xl cursor-pointer hover:text-blue-800 transition-colors"
                   onClick={() => companyInfo.website && handleWebsiteClick(companyInfo.website)}
              >
                🌐 Visit Website
              </div>
              <div className="text-gray-800 text-xl font-semibold mt-2">
                {companyInfo.companyName}
              </div>
              <div className="text-gray-600 text-lg mt-3 leading-relaxed">
                {companyInfo.shortDescription}
              </div>
            </div>
          </div>
          <div 
            className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-6 h-6 bg-white border-r-4 border-b-4 border-blue-500"
          />
        </div>
      </Html>
    );
  };

  return (
    <group ref={group} position={position} rotation={rotation} {...props}>
      <primitive object={model} scale={scale} />
      {selected && (
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1, 32]} />
          <meshBasicMaterial color="#00ffff" side={THREE.DoubleSide} transparent opacity={0.5} />
        </mesh>
      )}
      {renderBubbleMessage()}
    </group>
  );
}


