'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Building } from '../3d/Building';
import { BuildingModel } from '../3d/BuildingModel';
import * as THREE from "three";

interface LogoPlaygroundProps {
  logoSvg?: string;
  onLogoUpload: (svgContent: string) => void;
  companyName: string;
  website?: string;
  onWebsiteChange?: (website: string) => void;
  buildingType?: string;
  selectedModel?: {
    id: string;
    name: string;
    description?: string;
    type: string; // 'model' or 'procedural'
    modelType?: string; // for 3D models
    buildingType?: string; // for procedural buildings
  };
}

export function LogoPlayground({
  logoSvg,
  onLogoUpload,
  companyName,
  website,
  onWebsiteChange,
  buildingType,
  selectedModel
}: LogoPlaygroundProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewBuilding, setPreviewBuilding] = useState(buildingType || 'house');

  // Update preview building when buildingType prop changes
  useEffect(() => {
    if (buildingType) {
      setPreviewBuilding(buildingType);
    }
  }, [buildingType]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const svgContent = e.target?.result as string;
        onLogoUpload(svgContent);
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a valid SVG file.');
    }
  }, [onLogoUpload]);

  const handleWebsiteChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onWebsiteChange?.(event.target.value);
  }, [onWebsiteChange]);

  // Render the 2D bubble message preview
  const renderBubbleMessage = () => {
    return (
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg p-4 shadow-lg w-64 z-10">
        <div className="flex items-center space-x-3">
          {logoSvg && (
            <div 
              className="w-12 h-12 bg-white rounded flex-shrink-0"
              dangerouslySetInnerHTML={{ __html: logoSvg }}
            />
          )}
          <div className="flex-1">
            <div className="text-blue-600 font-medium text-sm">
              {website ? 'Visit Website' : 'Website'}
            </div>
            <div className="text-gray-800 text-xs">
              {companyName || 'Your Company'}
            </div>
          </div>
        </div>
        {/* Bubble pointer */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-4 h-4 bg-white"></div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Logo Upload Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Upload Company Logo</h3>
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {logoSvg ? (
              <div className="space-y-2">
                <div 
                  className="w-20 h-20 mx-auto bg-white rounded p-2"
                  dangerouslySetInnerHTML={{ __html: logoSvg }}
                />
                <p className="text-green-400 text-sm">Logo uploaded successfully!</p>
                <p className="text-gray-400 text-xs">Click to change logo</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-16 h-16 mx-auto bg-gray-700 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-gray-300">Upload SVG Logo</p>
                <p className="text-gray-500 text-sm">Click to browse or drag and drop</p>
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,image/svg+xml"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Website Input */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Company Website</h3>
        <div className="space-y-2">
          <input
            type="url"
            placeholder="https://example.com"
            value={website || ''}
            onChange={handleWebsiteChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <p className="text-gray-400 text-sm">This website link will appear in the bubble message above your building</p>
        </div>
      </div>

      {/* 3D Preview */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Bubble Message Preview</h3>
        <div className="bg-gray-900 rounded-lg overflow-hidden relative" style={{ height: '400px' }}>
          {/* 2D Bubble Message */}
          {renderBubbleMessage()}
          
          <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
            <Environment preset="sunset" />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            
            {selectedModel && selectedModel.type === 'model' && selectedModel.modelType ? (
              <BuildingModel
                modelType={selectedModel.modelType as 'low_poly' | 'sugarcube'}
                scale={1.5}
                position={[0, 0, 0]}
                color="#4A90E2"
                selected={false}
              />
            ) : (
              <Building
                type={selectedModel?.buildingType || previewBuilding}
                position={[0, 0, 0]}
                height={3}
                color="#4A90E2"
                rotation={0}
                advertising={{
                  enabled: false, // Disable 3D advertising since we're using 2D bubble
                  companyName: companyName || 'Your Company',
                  website: website,
                  logoSvg: logoSvg
                }}
              />
            )}
            
            <OrbitControls enableZoom={true} enablePan={false} />
          </Canvas>
        </div>
        
        {/* Building Type Selector for Preview (only show for procedural buildings) */}
        {(!selectedModel || selectedModel.type !== 'model') && (
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
        )}
      </div>
    </div>
  );
}

export default LogoPlayground;