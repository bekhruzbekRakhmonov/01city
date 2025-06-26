'use client';

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Building } from '../3d/Building';

interface BannerStyle {
  id: string;
  name: string;
  description: string;
  preview: {
    bannerColor: string;
    textColor: string;
    animationStyle: string;
  };
}

interface BannerPosition {
  id: string;
  name: string;
  description: string;
}

const BANNER_STYLES: BannerStyle[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional white banner with black text',
    preview: {
      bannerColor: '#ffffff',
      textColor: '#333333',
      animationStyle: 'none'
    }
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Sleek dark banner with white text',
    preview: {
      bannerColor: '#2d3748',
      textColor: '#ffffff',
      animationStyle: 'none'
    }
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Bright neon banner with glowing effects',
    preview: {
      bannerColor: '#1a202c',
      textColor: '#00ffff',
      animationStyle: 'glow'
    }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean transparent banner with subtle text',
    preview: {
      bannerColor: 'rgba(255,255,255,0.1)',
      textColor: '#4a5568',
      animationStyle: 'none'
    }
  },
  {
    id: 'billboard',
    name: 'Billboard',
    description: 'Large colorful banner for maximum visibility',
    preview: {
      bannerColor: '#e53e3e',
      textColor: '#ffffff',
      animationStyle: 'pulse'
    }
  }
];

const BANNER_POSITIONS: BannerPosition[] = [
  {
    id: 'front',
    name: 'Front Face',
    description: 'Banner on the front of the building'
  },
  {
    id: 'side',
    name: 'Side Face',
    description: 'Banner on the side of the building'
  },
  {
    id: 'top',
    name: 'Rooftop',
    description: 'Banner on top of the building'
  },
  {
    id: 'corner',
    name: 'Corner Wrap',
    description: 'Banner wrapping around building corner'
  },
  {
    id: 'wrap',
    name: 'Full Wrap',
    description: 'Banner wrapping around entire building'
  }
];

interface BannerStyleSelectorProps {
  selectedStyle: string;
  selectedPosition: string;
  selectedBannerColor: string;
  selectedTextColor: string;
  selectedAnimation: string;
  onStyleChange: (styleId: string, style: BannerStyle) => void;
  onPositionChange: (positionId: string) => void;
  onColorChange: (bannerColor: string, textColor: string) => void;
  onAnimationChange: (animation: string) => void;
  companyName: string;
}

export function BannerStyleSelector({
  selectedStyle,
  selectedPosition,
  selectedBannerColor,
  selectedTextColor,
  selectedAnimation,
  onStyleChange,
  onPositionChange,
  onColorChange,
  onAnimationChange,
  companyName
}: BannerStyleSelectorProps) {
  const [previewBuilding, setPreviewBuilding] = useState('house');

  const handleStyleSelect = (style: BannerStyle) => {
    onStyleChange(style.id, style);
    onColorChange(style.preview.bannerColor, style.preview.textColor);
    onAnimationChange(style.preview.animationStyle);
  };

  return (
    <div className="w-full space-y-6">
      {/* Banner Style Selection */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Banner Style</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BANNER_STYLES.map((style) => (
            <div
              key={style.id}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                selectedStyle === style.id
                  ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/20'
                  : 'border-gray-600 bg-gray-800 hover:border-gray-500'
              }`}
              onClick={() => handleStyleSelect(style)}
            >
              {/* Style Preview */}
              <div 
                className="h-16 rounded mb-3 flex items-center justify-center text-sm font-medium"
                style={{
                  backgroundColor: style.preview.bannerColor,
                  color: style.preview.textColor,
                  border: style.id === 'minimal' ? '1px solid #4a5568' : 'none'
                }}
              >
                {companyName || 'Company Name'}
              </div>
              
              <h4 className="font-semibold text-white mb-1">{style.name}</h4>
              <p className="text-sm text-gray-400">{style.description}</p>
              
              {selectedStyle === style.id && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Banner Position Selection */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Banner Position</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BANNER_POSITIONS.map((position) => (
            <div
              key={position.id}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                selectedPosition === position.id
                  ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/20'
                  : 'border-gray-600 bg-gray-800 hover:border-gray-500'
              }`}
              onClick={() => onPositionChange(position.id)}
            >
              <h4 className="font-semibold text-white mb-1">{position.name}</h4>
              <p className="text-sm text-gray-400">{position.description}</p>
              
              {selectedPosition === position.id && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Color Picker */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Custom Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Banner Color
            </label>
            <input
              type="color"
              value={selectedBannerColor}
              onChange={(e) => onColorChange(e.target.value, selectedTextColor)}
              className="w-full h-10 rounded border border-gray-600 bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Text Color
            </label>
            <input
              type="color"
              value={selectedTextColor}
              onChange={(e) => onColorChange(selectedBannerColor, e.target.value)}
              className="w-full h-10 rounded border border-gray-600 bg-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Animation Selection */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Animation Style</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['none', 'glow', 'pulse', 'scroll'].map((animation) => (
            <button
              key={animation}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                selectedAnimation === animation
                  ? 'border-blue-500 bg-blue-900/20 text-blue-400'
                  : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
              }`}
              onClick={() => onAnimationChange(animation)}
            >
              {animation.charAt(0).toUpperCase() + animation.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Preview */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
        <div className="bg-gray-900 rounded-lg overflow-hidden" style={{ height: '300px' }}>
          <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
            <Environment preset="sunset" />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            
            <Building
              type={previewBuilding}
              position={[0, 0, 0]}
              height={3}
              color="#4A90E2"
              rotation={0}
              companyInfo={{
                companyName: companyName || 'Your Company',
                website: '',
                logoSvg: '',
                shortDescription: 'Banner preview building'
              }}
            />
            
            <OrbitControls enableZoom={true} enablePan={false} />
          </Canvas>
        </div>
        
        {/* Building Type Selector for Preview */}
        <div className="mt-4 flex gap-2">
          {['house', 'skyscraper', 'shop', 'techCampus'].map((buildingType) => (
            <button
              key={buildingType}
              className={`px-3 py-1 rounded text-sm ${
                previewBuilding === buildingType
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setPreviewBuilding(buildingType)}
            >
              {buildingType.charAt(0).toUpperCase() + buildingType.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BannerStyleSelector;