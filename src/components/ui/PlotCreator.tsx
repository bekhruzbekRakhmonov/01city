'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';

interface PlotCreatorProps {
  onComplete?: () => void;
}

export function PlotCreator({ onComplete }: PlotCreatorProps) {
  const { user } = useUser();
  const createPlot = useMutation(api.plots.create);
  
  // Plot position (would be selected on a map in a real implementation)
  const [position, setPosition] = useState({ x: Math.floor(Math.random() * 100) - 50, z: Math.floor(Math.random() * 100) - 50 });
  
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
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create Your Plot</h2>
      
      <div className="space-y-6">
        {/* Main Building Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Main Building</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Building Type
              </label>
              <select
                value={mainBuilding.type}
                onChange={(e) => setMainBuilding({ ...mainBuilding, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              >
                {buildingTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Height
              </label>
              <input
                type="range"
                min="3"
                max="20"
                value={mainBuilding.height}
                onChange={(e) => setMainBuilding({ ...mainBuilding, height: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                {mainBuilding.height} units
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <input
                type="color"
                value={mainBuilding.color}
                onChange={(e) => setMainBuilding({ ...mainBuilding, color: e.target.value })}
                className="w-full h-10 p-1 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rotation
              </label>
              <input
                type="range"
                min="0"
                max="6.28"
                step="0.01"
                value={mainBuilding.rotation}
                onChange={(e) => setMainBuilding({ ...mainBuilding, rotation: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                {Math.round(mainBuilding.rotation * 57.3)}°
              </div>
            </div>
          </div>
        </div>
        
        {/* Garden Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Garden</h3>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={garden.enabled}
                onChange={(e) => setGarden({ ...garden, enabled: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Garden</span>
            </label>
          </div>
          
          {garden.enabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Garden Style
                </label>
                <select
                  value={garden.style}
                  onChange={(e) => setGarden({ ...garden, style: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="simple">Simple</option>
                  <option value="lush">Lush</option>
                  <option value="zen">Zen</option>
                  <option value="modern">Modern</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Garden Elements
                </label>
                <div className="flex flex-wrap gap-2">
                  {gardenElements.map((element) => (
                    <button
                      key={element}
                      type="button"
                      onClick={() => toggleGardenElement(element)}
                      className={`px-3 py-1 text-sm rounded-full ${garden.elements.includes(element) 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}
                    >
                      {element.charAt(0).toUpperCase() + element.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Sub-Buildings Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Sub-Buildings</h3>
          
          {subBuildings.length > 0 && (
            <div className="mb-4 space-y-2">
              {subBuildings.map((building, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-2" 
                      style={{ backgroundColor: building.color }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {building.type.charAt(0).toUpperCase() + building.type.slice(1)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSubBuilding(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {showSubBuildingForm ? (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Building Type
                  </label>
                  <select
                    value={currentSubBuilding.type}
                    onChange={(e) => setCurrentSubBuilding({ ...currentSubBuilding, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    {subBuildingTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Size
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={currentSubBuilding.size}
                    onChange={(e) => setCurrentSubBuilding({ ...currentSubBuilding, size: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                    {currentSubBuilding.size.toFixed(1)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={currentSubBuilding.color}
                    onChange={(e) => setCurrentSubBuilding({ ...currentSubBuilding, color: e.target.value })}
                    className="w-full h-10 p-1 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rotation
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="6.28"
                    step="0.01"
                    value={currentSubBuilding.rotation}
                    onChange={(e) => setCurrentSubBuilding({ ...currentSubBuilding, rotation: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                    {Math.round(currentSubBuilding.rotation * 57.3)}°
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position X
                  </label>
                  <input
                    type="range"
                    min="-4"
                    max="4"
                    step="0.5"
                    value={currentSubBuilding.position.x}
                    onChange={(e) => setCurrentSubBuilding({ 
                      ...currentSubBuilding, 
                      position: { ...currentSubBuilding.position, x: parseFloat(e.target.value) } 
                    })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                    {currentSubBuilding.position.x}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position Z
                  </label>
                  <input
                    type="range"
                    min="-4"
                    max="4"
                    step="0.5"
                    value={currentSubBuilding.position.z}
                    onChange={(e) => setCurrentSubBuilding({ 
                      ...currentSubBuilding, 
                      position: { ...currentSubBuilding.position, z: parseFloat(e.target.value) } 
                    })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                    {currentSubBuilding.position.z}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSubBuildingForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addSubBuilding}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Building
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSubBuildingForm(true)}
              className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Sub-Building
            </button>
          )}
        </div>
        
        {/* Plot Information */}
        <div>
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Plot Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Describe your plot..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Creator Info (optional)
              </label>
              <input
                type="text"
                value={creatorInfo}
                onChange={(e) => setCreatorInfo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Your website, social media, etc."
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          className="px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create Plot
        </button>
      </div>
    </div>
  );
}