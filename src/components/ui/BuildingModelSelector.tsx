'use client';

import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { BuildingModel } from '../3d/BuildingModel';
import { Building } from '../3d/Building';

// Available building models
const BUILDING_MODELS = [
  {
    id: 'low_poly',
    name: 'Low Poly Building',
    description: 'Modern minimalist building with clean lines',
    type: 'model',
    modelType: 'low_poly' as const,
    preview: '/buildings3dmodel/low_poly_building.glb'
  },
  {
    id: 'sugarcube',
    name: 'Sugarcube Corner',
    description: 'Colorful corner building with unique architecture',
    type: 'model',
    modelType: 'sugarcube' as const,
    preview: '/buildings3dmodel/sugarcube_corner.glb'
  },
  {
    id: 'house',
    name: 'Classic House',
    description: 'Traditional residential house',
    type: 'procedural',
    buildingType: 'house'
  },
  {
    id: 'skyscraper',
    name: 'Skyscraper',
    description: 'Modern high-rise building',
    type: 'procedural',
    buildingType: 'skyscraper'
  },
  {
    id: 'shop',
    name: 'Shop',
    description: 'Commercial storefront building',
    type: 'procedural',
    buildingType: 'shop'
  },
  {
    id: 'techCampus',
    name: 'Tech Campus',
    description: 'Modern technology campus building',
    type: 'procedural',
    buildingType: 'techCampus'
  }
];

interface BuildingModelSelectorProps {
  selectedModel: string;
  onModelSelect: (modelId: string, modelData: any) => void;
  className?: string;
}

function ModelPreview({ model, isSelected, onClick }: { 
  model: typeof BUILDING_MODELS[0], 
  isSelected: boolean, 
  onClick: () => void 
}) {
  return (
    <div 
      className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/20' 
          : 'border-gray-600 bg-gray-800 hover:border-gray-500'
      }`}
      onClick={onClick}
    >
      {/* 3D Preview */}
      <div className="h-48 bg-gray-900">
        <Canvas
          camera={{ position: [3, 3, 3], fov: 50 }}
          style={{ pointerEvents: 'none' }}
        >
          <Suspense fallback={null}>
            <Environment preset="sunset" />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            
            {model.type === 'model' ? (
              <BuildingModel
                modelType={model.modelType!}
                scale={0.8}
                position={[0, -0.5, 0]}
                selected={isSelected}
              />
            ) : (
              <Building
                type={model.buildingType!}
                position={[0, 0, 0]}
                height={2}
                color="#4A90E2"
                rotation={0}
              />
            )}
            
            <OrbitControls 
              enableZoom={false} 
              enablePan={false}
              autoRotate
              autoRotateSpeed={2}
            />
          </Suspense>
        </Canvas>
      </div>
      
      {/* Model Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1">{model.name}</h3>
        <p className="text-sm text-gray-400">{model.description}</p>
        
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
            ✓
          </div>
        )}
      </div>
    </div>
  );
}

export function BuildingModelSelector({ 
  selectedModel, 
  onModelSelect, 
  className = '' 
}: BuildingModelSelectorProps) {
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);

  const handleModelSelect = (model: typeof BUILDING_MODELS[0]) => {
    const modelData = {
      id: model.id,
      name: model.name,
      description: model.description,
      type: model.type,
      ...(model.type === 'model' ? {
        modelType: model.modelType,
        preview: model.preview
      } : {
        buildingType: model.buildingType
      })
    };
    
    onModelSelect(model.id, modelData);
  };

  return (
    <div className={`w-full ${className}`}>
      <h3 className="text-xl font-semibold text-white mb-4 text-center">
        Choose Your Building Model
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BUILDING_MODELS.map((model) => (
          <ModelPreview
            key={model.id}
            model={model}
            isSelected={selectedModel === model.id}
            onClick={() => handleModelSelect(model)}
          />
        ))}
      </div>
      
      {/* Selected model info */}
      {selectedModel && (
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="font-semibold text-white mb-2">Selected Model:</h4>
          {(() => {
            const selected = BUILDING_MODELS.find(m => m.id === selectedModel);
            return selected ? (
              <div>
                <p className="text-blue-400 font-medium">{selected.name}</p>
                <p className="text-gray-300 text-sm">{selected.description}</p>
                <p className="text-gray-400 text-xs mt-1">
                  Type: {selected.type === 'model' ? '3D Model' : 'Procedural'}
                </p>
              </div>
            ) : null;
          })()} 
        </div>
      )}
    </div>
  );
}

export default BuildingModelSelector;