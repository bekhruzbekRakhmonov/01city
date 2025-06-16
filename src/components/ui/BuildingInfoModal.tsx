'use client';

import React from 'react';

interface BuildingInfoTooltipProps {
  isOpen: boolean;
  onClose: () => void;
  buildingInfo: {
    type: string;
    height: number;
    advertising?: {
      enabled: boolean;
      companyName?: string;
      website?: string;
      description?: string;
      contactEmail?: string;
      bannerStyle?: string;
      bannerPosition?: string;
      bannerColor?: string;
      textColor?: string;
      animationStyle?: string;
    };
  } | null;
}

export function BuildingInfoModal({ isOpen, onClose, buildingInfo }: BuildingInfoTooltipProps) {
  if (!isOpen || !buildingInfo) return null;

  const { advertising } = buildingInfo;
  const hasAdvertising = advertising?.enabled && advertising?.companyName;

  const handleWebsiteClick = () => {
    if (advertising?.website) {
      const url = advertising.website.startsWith('http') 
        ? advertising.website 
        : `https://${advertising.website}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleEmailClick = () => {
    if (advertising?.contactEmail) {
      window.location.href = `mailto:${advertising.contactEmail}`;
    }
  };

  return (
    <div 
      style={{
        position: 'absolute',
        top: '-20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#1f2937',
        borderRadius: '8px',
        padding: '16px',
        color: 'white',
        minWidth: '250px',
        maxWidth: '350px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
        border: '1px solid #374151',
        zIndex: 1000,
        pointerEvents: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Tooltip Arrow */}
      <div 
        style={{
          position: 'absolute',
          bottom: '-8px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid #1f2937'
        }}
      />
      
      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'none',
          border: 'none',
          color: '#9ca3af',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '2px',
          borderRadius: '4px',
          lineHeight: '1'
        }}
        onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
        onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
      >
        ×
      </button>

        {/* Building Information */}
        <div style={{ marginBottom: hasAdvertising ? '16px' : '0' }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '16px', 
            fontWeight: 'bold',
            color: '#f9fafb'
          }}>
            {buildingInfo.type.charAt(0).toUpperCase() + buildingInfo.type.slice(1)}
          </h3>
          
          <div style={{ fontSize: '13px', color: '#d1d5db' }}>
            Height: <span style={{ color: '#f9fafb' }}>{buildingInfo.height}m</span>
          </div>
        </div>

        {/* Advertising Information */}
        {hasAdvertising && (
          <div style={{ 
            borderTop: '1px solid #374151',
            paddingTop: '12px'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: '#10b981',
              marginBottom: '8px'
            }}>
              {advertising.companyName}
            </div>
            
            {advertising.description && (
              <p style={{ 
                margin: '0 0 12px 0', 
                color: '#d1d5db',
                fontSize: '12px',
                lineHeight: '1.4'
              }}>
                {advertising.description}
              </p>
            )}
            
            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {advertising.website && (
                <button
                  onClick={handleWebsiteClick}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                >
                  Website
                </button>
              )}
              
              {advertising.contactEmail && (
                <button
                  onClick={handleEmailClick}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                >
                  Contact
                </button>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

export default BuildingInfoModal;