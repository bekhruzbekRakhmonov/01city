'use client';

import React, { useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useUser } from '@clerk/nextjs';
import { Building } from './Building';
import { Garden } from './Garden';
import { SubBuilding } from './SubBuilding';
import { BuildingInfoModal } from '../ui/BuildingInfoModal';
import { MailboxModal } from '../ui/MailboxModal';
import { Id } from '../../../convex/_generated/dataModel';

// Match this with your Convex schema for plots
interface PlotData {
  _id: Id<'plots'>;
  userId: string;
  username?: string;
  position: { x: number; z: number };
  size: { width: number; depth: number };
  mainBuilding: {
    type: string;
    height: number;
    color: string;
    rotation?: number;
    customizations?: {
      selectedModel?: {
        id: string;
        name: string;
        type: string;
        modelType?: string;
        buildingType?: string;
      };
      // ... any other customizations, ensure this matches what Building component expects or cast to any
    };
  };
  address?: {
    street: string;
    district: string;
    cityCode: string;
    coordinates: { lat: number; lng: number; };
  };
  mailbox?: {
    enabled: boolean;
    address: string;
    publicContact?: {
        email?: string;
        phone?: string;
        website?: string;
    };
  };
  garden?: {
    enabled: boolean;
    style: string;
    elements: string[];
  };
  subBuildings?: Array<{
    type: string;
    position: { x: number; z: number };
    rotation?: number;
    size: number;
    color: string;
    customizations?: Record<string, unknown>;
  }>;
  companyInfo?: {
    companyName: string;
    website: string;
    logoSvg: string;
    shortDescription: string;
    uploadedAt?: number;
  };
  description?: string;
  creatorInfo?: string;
}

interface PlotProps {
  plot: PlotData;
  isSelectable?: boolean;
  onSelect?: () => void;
}

export function Plot({ plot, isSelectable = false, onSelect }: PlotProps) {
  const { user } = useUser();
  const currentUserId = user?.id;

  const [showBuildingInfoModal, setShowBuildingInfoModal] = useState(false);
  const [showMailboxModal, setShowMailboxModal] = useState(false);
  const [selectedMailboxPlotData, setSelectedMailboxPlotData] = useState<{
    plotId: Id<'plots'>; // Keep Id<'plots'> here for type safety with MailboxModal
    ownerId: string;
    mailboxAddress?: string;
  } | null>(null);

  const [isHovered, setIsHovered] = useState(false);
  
  const plotWidth = plot.size.width;
  const plotDepth = plot.size.depth;
  
  const handlePlotClick = () => {
    if (isSelectable && onSelect) {
      onSelect();
    } else {
      setShowBuildingInfoModal(!showBuildingInfoModal);
    }
  };

  // Adjusted to match BuildingInfoModal's onOpenMailbox prop signature
  const handleOpenMailbox = (plotIdStr: string, ownerId: string | undefined, mailboxAddress?: string) => {
    if (!ownerId) {
        console.error("Owner ID is undefined, cannot open mailbox.");
        return;
    }
    // Assuming plotIdStr is the string version of Id<'plots'>, which it is from plot._id.toString()
    // For selectedMailboxPlotData, we need the actual Id<'plots'> type.
    // This might require fetching the plot again if only string ID is available,
    // or ensuring BuildingInfoModal can pass the original Id<'plots'> if possible.
    // For now, we'll use the plot._id directly from the `plot` prop.
    setSelectedMailboxPlotData({ plotId: plot._id, ownerId, mailboxAddress });
    setShowMailboxModal(true);
    setShowBuildingInfoModal(false); 
  };

  const handleCloseMailboxModal = () => {
    setShowMailboxModal(false);
    setSelectedMailboxPlotData(null);
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
  
  return (
    <React.Fragment>
      <group 
        position={[plot.position.x, 0, plot.position.z]}
        onClick={handlePlotClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[plotWidth, plotDepth]} />
          <meshStandardMaterial 
            color={isHovered ? "#4CAF50" : "#f0f0f0"} 
            transparent 
            opacity={isHovered ? 0.5 : 0.3} 
          />
        </mesh>

        {/* Address Marker */}
        {plot.address && (
          <Html
            position={[0, plot.mainBuilding.height + 1, 0]}
            center
            distanceFactor={10}
            style={{
              pointerEvents: 'none',
              fontSize: '10px',
              color: 'white',
              textShadow: '0 0 5px rgba(0,0,0,0.8)',
              whiteSpace: 'nowrap',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            {plot.address.street}
          </Html>
        )}

        {/* Mailbox Indicator */}
        {plot.mailbox?.enabled && (
          <group position={[plotWidth/2 - 0.5, 0, 0]}>
            <mesh position={[0, 0.5, 0]} rotation={[0, Math.PI/2, 0]}>
              <boxGeometry args={[0.3, 0.4, 0.2]} />
              <meshStandardMaterial color="#c41e3a" />
            </mesh>
            <mesh position={[0, 0.3, 0.15]} rotation={[0, Math.PI/2, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
              <meshStandardMaterial color="#8b0000" />
            </mesh>
            <Html
              position={[0, 1, 0]}
              center
              distanceFactor={15}
              style={{
                pointerEvents: 'none',
                fontSize: '8px',
                color: 'white',
                textShadow: '0 0 5px rgba(0,0,0,0.8)',
                whiteSpace: 'nowrap',
                transform: 'translateX(-50%)',
                textAlign: 'center',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '2px 4px',
                borderRadius: '3px',
              }}
            >
              📭 {plot.mailbox.address}
            </Html>
          </group>
        )}
        
        <Building 
          type={plot.mainBuilding.type}
          position={[0, 0, 0]}
          height={plot.mainBuilding.height}
          color={plot.mainBuilding.color}
          rotation={plot.mainBuilding.rotation || 0}
          customizations={plot.mainBuilding.customizations as any} // Addressed type mismatch with 'as any'
          selectedModel={plot.mainBuilding.customizations?.selectedModel} // Safe access
          plotId={plot._id}
          companyInfo={plot.companyInfo}
        />
        
        {plot.garden && plot.garden.enabled && (
          <Garden 
            style={plot.garden.style}
            elements={plot.garden.elements}
            plotSize={{ width: plotWidth, depth: plotDepth }}
          />
        )}
        
        {plot.subBuildings && plot.subBuildings.map((subBuilding, index: number) => (
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
      </group>

      {showBuildingInfoModal && (
        <Html
          position={[plot.position.x, plot.mainBuilding.height + 5, plot.position.z]} 
          center
          distanceFactor={15}
          style={{ pointerEvents: 'none', width: '350px' }}
          zIndexRange={[100,0]} 
        >
          <BuildingInfoModal
            isOpen={showBuildingInfoModal}
            onClose={() => setShowBuildingInfoModal(false)}
            buildingInfo={{
              type: plot.mainBuilding.type,
              height: plot.mainBuilding.height,
              address: plot.address,
              companyInfo: plot.companyInfo,
              userId: plot.userId,
              plotId: plot._id.toString(), // Pass as string
              mailbox: plot.mailbox
            }}
            currentUserId={currentUserId}
            onOpenMailbox={handleOpenMailbox} 
          />
        </Html>
      )}

      {showMailboxModal && selectedMailboxPlotData && (
        <MailboxModal
          isOpen={showMailboxModal}
          onClose={handleCloseMailboxModal}
          plotId={selectedMailboxPlotData!.plotId} // Non-null assertion
          plotOwnerId={selectedMailboxPlotData!.ownerId} // Non-null assertion
          plotMailboxAddress={selectedMailboxPlotData!.mailboxAddress} // Non-null assertion
        />
      )}
    </React.Fragment>
  );
}