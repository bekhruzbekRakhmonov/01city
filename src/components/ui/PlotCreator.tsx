import { useState, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import PaymentModal from './PaymentModal';
import ModelUploader from './ModelUploader';

interface PlotCreatorProps {
  initialPosition: { x: number; z: number };
  onComplete?: () => void;
}

export function PlotCreator({ initialPosition, onComplete }: PlotCreatorProps) {
  const [step, setStep] = useState(1); // 1: Land Type, 2: Building Type, 3: Custom Model, 4: Customization, 5: Payment
  const { user } = useUser();
  const purchasePlot = useMutation(api.api.purchasePlot);
  const userInfo = useQuery(api.users.getCurrentUser, { userId: user?.id });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use the provided initial position
  const [position] = useState(initialPosition);
  
  // Land type selection
  const [landType, setLandType] = useState<'free' | 'paid'>('free');
  
  // Main building configuration
  const [mainBuilding, setMainBuilding] = useState({
    type: 'house',
    height: 5,
    color: '#4A90E2',
    rotation: 0,
    customizations: {}
  });
  
  // Custom model configuration
  const [customModel, setCustomModel] = useState({
    enabled: false,
    file: null as File | null,
    modelUrl: '',
    name: '',
    description: ''
  });
  
  // Garden configuration
  const [garden, setGarden] = useState({
    enabled: true,
    style: 'simple',
    elements: ['tree', 'bush', 'flower'],
  });
  
  // Sub-buildings configuration
  const [subBuildings, setSubBuildings] = useState<any[]>([]);
  
  // Plot information
  const [description, setDescription] = useState('');
  const [creatorInfo, setCreatorInfo] = useState('');
  
  // Payment state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showModelUploader, setShowModelUploader] = useState(false);
  
  // Building types
  const buildingTypes = ['house', 'skyscraper', 'shop', 'tower', 'techCampus', 'startupOffice', 'dataCenter'];
  const subBuildingTypes = ['cafe', 'studio', 'gallery', 'gazebo', 'fountain', 'techLounge', 'bikeStation', 'innovationLab'];
  
  // Garden elements
  const gardenElements = ['tree', 'bush', 'flower', 'rock', 'pond', 'solarPanel', 'sculpture'];
  
  // Calculate pricing
  const baseLandPrice = landType === 'paid' ? 1000 : 0; // $10.00 for paid land
  const customModelPrice = customModel.enabled ? 2000 : 0; // $20.00 for custom model
  const totalPrice = baseLandPrice + customModelPrice;
  
  // Check if user has enough credits for free land
  const hasEnoughCredits = userInfo?.freeSquares && userInfo.freeSquares > 0;
  
  // Handle file upload for custom models
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'];
      const validExtensions = ['.glb', '.gltf'];
      const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (hasValidExtension || validTypes.includes(file.type)) {
        setCustomModel({
          ...customModel,
          file,
          name: file.name.replace(/\.[^/.]+$/, '') // Remove extension
        });
      } else {
        alert('Please upload a valid GLB or GLTF file.');
      }
    }
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
    if (step < 5) {
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
    
    setIsProcessingPayment(true);
    setPaymentError('');
    
    try {
      // Calculate total cost
      let totalCost = 0;
      if (landType === 'paid') {
        totalCost += 10; // Base land cost
      }
      if (customModel.enabled && customModel.file) {
        totalCost += 5; // Custom model fee
      }
      
      // Show payment modal if payment is needed
      if (totalCost > 0 && !paymentId) {
        setShowPaymentModal(true);
        setIsProcessingPayment(false);
        return;
      }
      
      // Prepare building data
      const buildingData = {
        type: mainBuilding.type,
        height: mainBuilding.height,
        color: mainBuilding.color,
        rotation: [mainBuilding.rotation, 0, 0],
        customizations: mainBuilding.customizations
      };
      
      // Prepare custom model data if enabled
      const customModelData = customModel.enabled ? {
        enabled: true,
        name: customModel.name,
        description: customModel.description,
        // In a real implementation, you would upload the file to a storage service
        // and get back a URL. For now, we'll use a placeholder.
        modelUrl: customModel.file ? `uploads/${customModel.file.name}` : ''
      } : undefined;
      
      await purchasePlot({
        position,
        size: { width: 10, depth: 10 },
        building: buildingData,
        customModel: customModelData,
        garden: garden.enabled ? garden : undefined,
        subBuildings: subBuildings.length > 0 ? subBuildings : undefined,
        description,
        creatorInfo,
        paymentMethod: landType === 'free' ? 'credits' : 'stripe',
        paymentId
      });
      
      // Reset form or navigate away
      if (onComplete) onComplete();
    } catch (error: any) {
      console.error('Error creating plot:', error);
      setPaymentError(error.message || 'Failed to create plot. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };
  
  const handlePaymentSuccess = (newPaymentId: string) => {
    setPaymentId(newPaymentId);
    setShowPaymentModal(false);
    // Continue with plot creation
    handleSubmit();
  };
  
  const handleModelUpload = (modelData: { url: string; name: string; description: string }) => {
    setCustomModel({
      enabled: true,
      file: null,
      modelUrl: modelData.url,
      name: modelData.name,
      description: modelData.description
    });
    setShowModelUploader(false);
  };
  
  return (
    <>
      <Html>
        <div style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
        {showPaymentModal && (
          <PaymentModal
            amount={totalPrice}
            onSuccess={handlePaymentSuccess}
            onClose={() => setShowPaymentModal(false)}
          />
        )}
        {showModelUploader && (
          <ModelUploader
            onUpload={handleModelUpload}
            onClose={() => setShowModelUploader(false)}
          />
        )}
      </Html>
      
      <group position={[0, 5, 0]} rotation={[0, 0, 0]}>
        {/* Background panel */}
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[12, 10]} />
          <meshStandardMaterial color="#1f2937" opacity={0.9} transparent />
        </mesh>

        {/* Title */}
        <Text
          position={[0, 4, 0]}
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Create Your Plot
        </Text>

        {/* Step 1: Land Type Selection */}
        {step === 1 && (
          <group>
            <Text
              position={[0, 3, 0]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              Choose Land Type
            </Text>
            
            {/* Free Land Option */}
            <group position={[-2.5, 1, 0]} rotation={[0, 0, 0]} onClick={() => setLandType('free')}>
              <mesh>
                <planeGeometry args={[4, 2]} />
                <meshStandardMaterial 
                  color={landType === 'free' ? "#22c55e" : "#4b5563"} 
                />
              </mesh>
              <Text position={[0, 0.3, 0.1]} fontSize={0.25} color="white" anchorX="center">
                Free Land
              </Text>
              <Text position={[0, -0.1, 0.1]} fontSize={0.15} color="white" anchorX="center">
                Use Credits: {userInfo?.freeSquares || 0}
              </Text>
              <Text position={[0, -0.4, 0.1]} fontSize={0.15} color="white" anchorX="center">
                {hasEnoughCredits ? 'Available' : 'No Credits'}
              </Text>
            </group>
            
            {/* Paid Land Option */}
            <group position={[2.5, 1, 0]} rotation={[0, 0, 0]} onClick={() => setLandType('paid')}>
              <mesh>
                <planeGeometry args={[4, 2]} />
                <meshStandardMaterial 
                  color={landType === 'paid' ? "#3b82f6" : "#4b5563"} 
                />
              </mesh>
              <Text position={[0, 0.3, 0.1]} fontSize={0.25} color="white" anchorX="center">
                Premium Land
              </Text>
              <Text position={[0, -0.1, 0.1]} fontSize={0.15} color="white" anchorX="center">
                $10.00
              </Text>
              <Text position={[0, -0.4, 0.1]} fontSize={0.15} color="white" anchorX="center">
                Full Features
              </Text>
            </group>
            
            {/* Next Button */}
            <group position={[0, -2, 0]} rotation={[0, 0, 0]}>
              <mesh position={[0, 0, 0]} onClick={handleNext}>
                <planeGeometry args={[3, 0.8]} />
                <meshStandardMaterial 
                  color={(landType === 'free' && hasEnoughCredits) || landType === 'paid' ? "#3b82f6" : "#6b7280"} 
                />
              </mesh>
              <Text position={[0, 0, 0.1]} fontSize={0.2} color="white" anchorX="center">
                {(landType === 'free' && !hasEnoughCredits) ? 'No Credits Available' : 'Next'}
              </Text>
            </group>
          </group>
        )}

        {/* Step 2: Building Type Selection */}
        {step === 2 && (
          <group>
            <Text
              position={[0, 3, 0]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              Choose Building Type
            </Text>
            
            {/* Building type options */}
            <group position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
              {buildingTypes.map((type, index) => {
                const row = Math.floor(index / 3);
                const col = index % 3;
                const x = (col - 1) * 3;
                const y = 1.5 - row * 1.2;
                
                return (
                  <group key={type} position={[x, y, 0]} onClick={() => {
                    setMainBuilding({ ...mainBuilding, type });
                  }}>
                    <mesh>
                      <planeGeometry args={[2.5, 1]} />
                      <meshStandardMaterial 
                        color={mainBuilding.type === type ? "#3b82f6" : "#4b5563"} 
                      />
                    </mesh>
                    <Text
                      position={[0, 0, 0.1]}
                      fontSize={0.18}
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
            
            {/* Navigation buttons */}
            <group position={[0, -2.5, 0]} rotation={[0, 0, 0]}>
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

        {/* Step 3: Custom Model Upload */}
        {step === 3 && (
          <group>
            <Text
              position={[0, 3, 0]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              Custom 3D Model (Optional)
            </Text>
            
            {/* Custom model toggle */}
            <group position={[0, 2, 0]} rotation={[0, 0, 0]}>
              <mesh 
                onClick={() => setCustomModel({ ...customModel, enabled: !customModel.enabled })}
              >
                <planeGeometry args={[6, 0.8]} />
                <meshStandardMaterial color={customModel.enabled ? "#3b82f6" : "#4b5563"} />
              </mesh>
              <Text position={[0, 0, 0.1]} fontSize={0.2} color="white" anchorX="center">
                {customModel.enabled ? "Custom Model Enabled (+$20)" : "Use Default Models"}
              </Text>
            </group>
            
            {/* File upload section */}
                {customModel.enabled && (
                  <group>
                    <group position={[0, 1, 0]} rotation={[0, 0, 0]}>
                      <mesh onClick={() => setShowModelUploader(true)}>
                        <planeGeometry args={[8, 1]} />
                        <meshStandardMaterial color="#374151" />
                      </mesh>
                      <Text position={[0, 0, 0.1]} fontSize={0.18} color="white" anchorX="center">
                        {customModel.file ? customModel.file.name : "Click to Upload GLB/GLTF File"}
                      </Text>
                    </group>
                    
                    {/* Model info display */}
                    {customModel.modelUrl && (
                      <group position={[0, 0, 0]} rotation={[0, 0, 0]}>
                        <Text position={[0, 0.3, 0]} fontSize={0.2} color="#22c55e" anchorX="center">
                          ✓ Model uploaded: {customModel.name}
                        </Text>
                        <Text position={[0, -0.1, 0]} fontSize={0.15} color="#9ca3af" anchorX="center">
                          {customModel.description}
                        </Text>
                      </group>
                    )}
                    
                    {/* Model name input */}
                    {!customModel.modelUrl && (
                      <group position={[0, 0, 0]}>
                        <Text position={[0, 0.3, 0]} fontSize={0.15} color="white" anchorX="center">
                          Model Name
                        </Text>
                        <mesh>
                          <planeGeometry args={[6, 0.6]} />
                          <meshStandardMaterial color="#374151" />
                        </mesh>
                        <Text position={[0, 0, 0.1]} fontSize={0.15} color="white" anchorX="center">
                          {customModel.name || 'Click to enter name'}
                        </Text>
                      </group>
                    )}
                    
                    {/* Model description input */}
                    {!customModel.modelUrl && (
                      <group position={[0, -1, 0]} rotation={[0, 0, 0]}>
                        <Text position={[0, 0.3, 0]} fontSize={0.15} color="white" anchorX="center">
                          Description
                        </Text>
                        <mesh>
                          <planeGeometry args={[6, 0.6]} />
                          <meshStandardMaterial color="#374151" />
                        </mesh>
                        <Text position={[0, 0, 0.1]} fontSize={0.15} color="white" anchorX="center">
                          {customModel.description || 'Click to enter description'}
                        </Text>
                      </group>
                    )}
                  </group>
                )}
            
            {/* Navigation buttons */}
            <group position={[0, -2.5, 0]}>
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

        {/* Step 4: Building Customization */}
        {step === 4 && (
          <group>
            <Text
              position={[0, 3, 0]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              Customize Building
            </Text>

            {/* Height control */}
            <group position={[-3, 1, 0]} rotation={[0, 0, 0]}>
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
            <group position={[0, 1, 0]}>
              <Text position={[0, 0.5, 0]} fontSize={0.2} color="white" anchorX="center">
                Color
              </Text>
              <group position={[0, 0, 0]}>
                {['#4A90E2', '#E24A90', '#4AE290', '#E2904A'].map((color, i) => (
                  <mesh
                    key={color}
                    position={[(i - 1.5) * 0.8, 0, 0]}
                    onClick={() => setMainBuilding({ ...mainBuilding, color })}
                  >
                    <planeGeometry args={[0.6, 0.6]} />
                    <meshStandardMaterial color={color} />
                  </mesh>
                ))}
              </group>
            </group>

            {/* Rotation control */}
            <group position={[3, 1, 0]} rotation={[0, 0, 0]}>
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
            
            {/* Garden toggle */}
            <group position={[0, 0, 0]}>
              <mesh 
                onClick={() => setGarden({ ...garden, enabled: !garden.enabled })}
              >
                <planeGeometry args={[4, 0.6]} />
                <meshStandardMaterial color={garden.enabled ? "#22c55e" : "#4b5563"} />
              </mesh>
              <Text position={[0, 0, 0.1]} fontSize={0.18} color="white" anchorX="center">
                {garden.enabled ? "Garden Enabled" : "Garden Disabled"}
              </Text>
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

        {/* Step 5: Payment Summary */}
        {step === 5 && (
          <group>
            <Text
              position={[0, 3, 0]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              Payment Summary
            </Text>
            
            {/* Cost breakdown */}
            <group position={[0, 1.5, 0]} rotation={[0, 0, 0]}>
              <Text position={[0, 0.5, 0]} fontSize={0.2} color="white" anchorX="center">
                Land: {landType === 'free' ? 'Free (Credits)' : '$10.00'}
              </Text>
              {customModel.enabled && (
                <Text position={[0, 0, 0]} fontSize={0.2} color="white" anchorX="center">
                  Custom Model: $20.00
                </Text>
              )}
              <Text position={[0, -0.5, 0]} fontSize={0.25} color="#22c55e" anchorX="center">
                Total: {landType === 'free' && !customModel.enabled ? 'Free' : `$${(totalPrice / 100).toFixed(2)}`}
              </Text>
            </group>
            
            {/* Error message */}
            {paymentError && (
              <Text position={[0, 0.5, 0]} fontSize={0.15} color="#ef4444" anchorX="center">
                {paymentError}
              </Text>
            )}
            
            {/* Plot info inputs */}
            <group position={[0, 0, 0]}>
              <mesh onClick={() => {
                const input = prompt('Enter plot description:');
                if (input) setDescription(input);
              }}>
                <planeGeometry args={[8, 0.6]} />
                <meshStandardMaterial color="#374151" />
              </mesh>
              <Text position={[0, 0, 0.1]} fontSize={0.15} color="white" anchorX="center">
                {description || 'Click to add description (optional)'}
              </Text>
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

              <mesh position={[2, 0, 0]} onClick={handleSubmit}>
                <planeGeometry args={[2, 0.8]} />
                <meshStandardMaterial 
                  color={isProcessingPayment ? "#6b7280" : "#22c55e"} 
                />
              </mesh>
              <Text position={[2, 0, 0.1]} fontSize={0.2} color="white" anchorX="center">
                {isProcessingPayment ? 'Processing...' : 'Create Plot'}
              </Text>
            </group>
          </group>
        )}
      </group>
      
      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        amount={(() => {
          let total = 0;
          if (landType === 'paid') total += 10;
          if (customModel.enabled && customModel.file) total += 5;
          return total;
        })()}
        description={`Land purchase${customModel.enabled ? ' + Custom Model' : ''}`}
        type={customModel.enabled ? 'custom_model' : 'land'}
      />
      
      {/* Model Uploader Modal */}
      {showModelUploader && (
        <div style={{ 
          position: 'fixed', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          zIndex: 1000,
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <ModelUploader
            onUploadComplete={handleModelUpload}
            onUploadError={(error) => console.error('Upload error:', error)}
          />
          <button 
            onClick={() => setShowModelUploader(false)}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </>
  );
}