import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import PaymentModal from './PaymentModal';
import ModelUploader from './ModelUploader';
import BuildingModelSelector from './BuildingModelSelector';


interface PlotCreatorProps {
  initialPosition: { x: number; z: number };
  onComplete?: () => void;
  onClose: () => void;
}

export function PlotCreator({ initialPosition, onComplete, onClose }: PlotCreatorProps) {
  const [step, setStep] = useState(1); // 1: Land Type & Model Selection, 2: Customization, 3: Review & Payment
  const { user } = useUser();
  const purchasePlot = useMutation(api.api.purchasePlot);
  const userInfo = useQuery(api.users.getCurrentUser, { userId: user?.id || undefined });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use the provided initial position
  const [position] = useState(initialPosition);

  // Land type selection
  const [landType, setLandType] = useState<'free' | 'premium'>('free');

  // Main building configuration
  const [mainBuilding, setMainBuilding] = useState({
    type: 'house',
    height: 5,
    color: '#4A90E2',
    rotation: 0,
    customizations: {},
    modelData: null as any // Store selected model data
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

  // Address information
  const [address, setAddress] = useState({
    street: '',
    number: '',
    district: '',
    city: 'MetroSpace City',
    postalCode: ''
  });

  // Mailbox configuration
  const [mailbox, setMailbox] = useState({
    enabled: false,
    address: '',
    type: 'standard', // 'standard', 'premium', 'business'
    autoResponder: false,
    customGreeting: ''
  });

  // Advertising/Company information
  const [advertising, setAdvertising] = useState({
    enabled: false,
    companyName: '',
    website: '',
    logoUrl: '',
    description: '',
    contactEmail: '',
    industry: '',
    services: [] as string[],
    socialMedia: {
      linkedin: '',
      twitter: '',
      facebook: '',
      instagram: ''
    },
    businessHours: {
      timezone: 'UTC',
      schedule: [
        { day: 'Monday', open: '09:00', close: '17:00', closed: false },
        { day: 'Tuesday', open: '09:00', close: '17:00', closed: false },
        { day: 'Wednesday', open: '09:00', close: '17:00', closed: false },
        { day: 'Thursday', open: '09:00', close: '17:00', closed: false },
        { day: 'Friday', open: '09:00', close: '17:00', closed: false },
        { day: 'Saturday', open: '10:00', close: '16:00', closed: false },
        { day: 'Sunday', open: '10:00', close: '16:00', closed: true }
      ]
    }
  });

  // AI Features configuration
  const [aiFeatures, setAiFeatures] = useState({
    chatbotEnabled: false,
    autoResponder: false,
    leadCapture: false,
    businessIntelligence: false,
    aiPersonality: 'professional',
    customPrompts: [] as string[]
  });

  // Payment state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showModelUploader, setShowModelUploader] = useState(false);

  // Calculate pricing with new features
  const baseLandPrice = landType === 'premium' ? 1000 : 0; // $10.00 for premium land
  const customModelPrice = customModel.enabled ? 2000 : 0; // $20.00 for custom model
  const mailboxPrice = mailbox.enabled ? (mailbox.type === 'business' ? 1500 : mailbox.type === 'premium' ? 1000 : 500) : 0;
  const advertisingPrice = advertising.enabled ? 2000 : 0; // $20.00 for advertising
  const aiPrice = Object.values(aiFeatures).filter(Boolean).length * 500; // $5.00 per AI feature
  const totalPrice = baseLandPrice + customModelPrice + mailboxPrice + advertisingPrice + aiPrice;

  // Check if user has enough credits for free land
  const hasEnoughCredits = userInfo?.freeSquares && userInfo.freeSquares > 0;

  // Generate unique mailbox address
  const generateMailboxAddress = () => {
    if (!mailbox.enabled) return '';
    
    const baseAddress = advertising.companyName 
      ? advertising.companyName.toLowerCase().replace(/[^a-z0-9]/g, '') 
      : `plot-${position.x}-${position.z}`;
    
    return `${baseAddress}@metrospace.city`;
  };

  // Update mailbox address when company name changes
  useEffect(() => {
    if (mailbox.enabled && advertising.companyName) {
      setMailbox(prev => ({
        ...prev,
        address: generateMailboxAddress()
      }));
    }
  }, [advertising.companyName, mailbox.enabled, position.x, position.z]);

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
    if (step < 3) {
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

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Submit the plot
  const handleSubmit = async () => {
    if (!user) {
      setPaymentError("Please sign in to create a plot.");
      return;
    }

    if (isSubmitting || isProcessingPayment) {
      return; // Prevent double submission
    }

    setIsSubmitting(true);
    setIsProcessingPayment(true);
    setPaymentError('');

    try {
      if (!userInfo) {
        setPaymentError("User information is loading. Please try again shortly.");
        setIsProcessingPayment(false);
        return;
      }

      // Backend-aligned cost calculation
      const currentUser = userInfo; // Assuming userInfo is the direct user object from useQuery
      const plotSize = { width: 10, depth: 10 }; // Fixed in current purchasePlot call
      const totalSquares = plotSize.width * plotSize.depth;
      const userFreeSquaresUsed = currentUser.freeSquaresUsed || 0;
      const baseFreeSquaresLimit = currentUser.freeSquaresLimit || 25;

      let subscriptionBonusSquares = 0;
      if (currentUser.subscriptionTier === "basic") {
        subscriptionBonusSquares = 50;
      } else if (currentUser.subscriptionTier === "premium") {
        subscriptionBonusSquares = 100;
      }
      const totalFreeSquaresAvailable = baseFreeSquaresLimit + subscriptionBonusSquares;

      const remainingFreeSquares = Math.max(0, totalFreeSquaresAvailable - userFreeSquaresUsed);
      const freeSquaresToUse = Math.min(totalSquares, remainingFreeSquares);
      const paidSquares = totalSquares - freeSquaresToUse;

      const calculatedPlotCost = paidSquares * 100; // Backend price per square: 100 credits

      let calculatedCustomModelFee = 0;
      if (customModel.enabled) { // If a custom model is part of the building args
        if (currentUser.subscriptionTier === "premium") {
          calculatedCustomModelFee = 0;
        } else if (currentUser.subscriptionTier === "basic") {
          calculatedCustomModelFee = 1000; // Backend fee: 1000 credits
        } else { // free tier
          calculatedCustomModelFee = 2000; // Backend fee: 2000 credits
        }
      }

      const predictedBackendTotalCost = calculatedPlotCost + calculatedCustomModelFee;
      const userCredits = currentUser.credits || 0;

      const requiresStripePayment = predictedBackendTotalCost > 0 && userCredits < predictedBackendTotalCost;

      if (requiresStripePayment && !paymentId) {
        setShowPaymentModal(true);
        setIsProcessingPayment(false);
        setIsSubmitting(false);
        return;
      }

      let finalPaymentMethod = 'free';
      if (predictedBackendTotalCost > 0) {
        if (userCredits >= predictedBackendTotalCost) {
          finalPaymentMethod = 'credits';
        } else {
          finalPaymentMethod = 'stripe';
        }
      }

      // Prepare building data
      const buildingData = {
        type: mainBuilding.type,
        height: mainBuilding.height,
        color: mainBuilding.color,
        rotation: {
          x: 0,
          y: mainBuilding.rotation,
          z: 0
        },
        customizations: mainBuilding.customizations,
        // Store selected model information
        selectedModel: mainBuilding.modelData ? {
          id: mainBuilding.modelData.id,
          name: mainBuilding.modelData.name,
          description: mainBuilding.modelData.description,
          type: mainBuilding.modelData.type,
          modelType: mainBuilding.modelData.modelType,
          buildingType: mainBuilding.modelData.buildingType
        } : null
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
        userId: user.id,
        position,
        size: { width: 10, depth: 10 },
        building: {
          ...buildingData,
          customModel: customModel.enabled, // Pass the boolean flag
          modelUrl: customModel.enabled ? customModel.modelUrl : undefined,
        },
        garden: garden.enabled ? garden : undefined,
        description,
        creatorInfo,
        paymentMethod: finalPaymentMethod,
        paymentIntentId: paymentId,
        companyInfo: {
          companyName: companyInfo.companyName,
          website: companyInfo.website,
          logoSvg: companyInfo.logoSvg,
          shortDescription: companyInfo.shortDescription
        },
        address: {
          street: address.street,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          country: address.country
        },
        mailbox: mailbox.enabled ? {
          enabled: true,
          address: mailbox.address,
          type: mailbox.type,
          autoResponder: mailbox.autoResponder,
          customGreeting: mailbox.customGreeting
        } : { enabled: false },
        advertising: {
          companyName: companyInfo.companyName,
          website: companyInfo.website,
          logoUrl: companyInfo.logoSvg,
          description: advertising.description,
          contact: advertising.contact,
          industry: advertising.industry,
          services: advertising.services,
          socialMedia: advertising.socialMedia,
          businessHours: advertising.businessHours
        },
        aiFeatures: {
          chatbot: aiFeatures.chatbot,
          autoResponder: aiFeatures.autoResponder,
          leadCapture: aiFeatures.leadCapture,
          businessIntelligence: aiFeatures.businessIntelligence,
          personality: aiFeatures.personality,
          customPrompts: aiFeatures.customPrompts
        },
        metadata: {
          landType,
          customModel: customModel.enabled,
          username: user.username || user.firstName || `user_${user.id.slice(-8)}`,
        },
      });

      // Reset form or navigate away
      if (onComplete) onComplete();
    } catch (error: any) {
      console.error('Error creating plot:', error);
      setPaymentError(error.message || 'Failed to create plot. Please try again.');
    } finally {
      setIsProcessingPayment(false);
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = (newPaymentId: string) => {
    setPaymentId(newPaymentId);
    setShowPaymentModal(false);
    setIsProcessingPayment(false);
    setIsSubmitting(false);
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

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: '#1f2937',
    padding: '30px',
    borderRadius: '12px',
    color: 'white',
    width: '600px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    position: 'relative',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.8em',
    marginBottom: '20px',
    textAlign: 'center',
    color: '#3b82f6',
    fontWeight: 'bold',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: '500',
    transition: 'all 0.2s',
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#3b82f6',
    color: 'white',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#6b7280',
    color: 'white',
  };

  const successButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#10b981',
    color: 'white',
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '15px',
    right: '20px',
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={modalOverlayStyle} onClick={step === 1 ? onClose : undefined}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        {step === 1 && (
          <button
            style={closeButtonStyle}
            onClick={onClose}
            onMouseOver={(e) => e.currentTarget.style.color = 'white'}
            onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
          >
            ×
          </button>
        )}
        <h2 style={titleStyle}>Create Your Plot</h2>

        {/* Step 1: Company Information & Land Type Selection */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: '1.25em', marginBottom: '20px', textAlign: 'center', color: '#e5e7eb' }}>Company Information & Land Type</h3>
            
            {/* Company Information Section */}
            <div style={{
              marginBottom: '32px',
              padding: '20px',
              backgroundColor: '#1f2937',
              borderRadius: '8px',
              border: '1px solid #374151'
            }}>
              <h4 style={{ fontSize: '18px', marginBottom: '16px', color: '#3b82f6', fontWeight: 'bold' }}>Company Information</h4>
              
              {/* Company Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Product or Company Name *</label>
                <input
                  type="text"
                  value={companyInfo.companyName}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })}
                  placeholder="Enter your company or product name"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    color: '#d1d5db',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Website */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Website *</label>
                <input
                  type="url"
                  value={companyInfo.website}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                  placeholder="https://yourcompany.com"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    color: '#d1d5db',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Logo SVG */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Logo (SVG format) *</label>
                <input
                  type="file"
                  accept=".svg,image/svg+xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.type === 'image/svg+xml') {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const svgContent = event.target?.result as string;
                        setCompanyInfo({ ...companyInfo, logoSvg: svgContent });
                      };
                      reader.readAsText(file);
                    } else {
                      alert('Please upload a valid SVG file.');
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    color: '#d1d5db',
                    fontSize: '14px'
                  }}
                />
                {companyInfo.logoSvg && (
                  <div style={{ marginTop: '8px', color: '#10b981', fontSize: '14px' }}>✓ Logo uploaded successfully</div>
                )}
              </div>

              {/* Short Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Short Description (max 10 words) *</label>
                <input
                  type="text"
                  value={companyInfo.shortDescription}
                  onChange={(e) => {
                    const words = e.target.value.split(' ').filter(word => word.length > 0);
                    if (words.length <= 10) {
                      setCompanyInfo({ ...companyInfo, shortDescription: e.target.value });
                    }
                  }}
                  placeholder="Brief description in 10 words or less"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    color: '#d1d5db',
                    fontSize: '14px'
                  }}
                />
                <div style={{ marginTop: '4px', color: '#9ca3af', fontSize: '12px' }}>
                  {companyInfo.shortDescription.split(' ').filter(word => word.length > 0).length}/10 words
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '1.1em', marginBottom: '16px', textAlign: 'center', color: '#e5e7eb' }}>Choose Land Type</h4>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '30px' }}>
              <div
                style={{
                  cursor: 'pointer',
                  padding: '24px',
                  borderRadius: '8px',
                  border: `2px solid ${landType === 'free' ? '#10b981' : '#6b7280'}`,
                  backgroundColor: landType === 'free' ? '#064e3b' : '#374151',
                  textAlign: 'center',
                  minWidth: '150px',
                  transition: 'all 0.2s'
                }}
                onClick={() => setLandType('free')}
              >
                <h4 style={{ fontSize: '1.1em', fontWeight: '600', marginBottom: '8px' }}>Free Land</h4>
                <p style={{ margin: '4px 0', color: '#9ca3af' }}>Use Credits: {userInfo?.freeSquares || 0}</p>
                <p style={{ margin: '4px 0', color: hasEnoughCredits ? '#10b981' : '#ef4444' }}>{hasEnoughCredits ? 'Available' : 'No Credits'}</p>
              </div>
              <div
                style={{
                  cursor: 'pointer',
                  padding: '24px',
                  borderRadius: '8px',
                  border: `2px solid ${landType === 'premium' ? '#3b82f6' : '#6b7280'}`,
                  backgroundColor: landType === 'premium' ? '#1e3a8a' : '#374151',
                  textAlign: 'center',
                  minWidth: '150px',
                  transition: 'all 0.2s'
                }}
                onClick={() => setLandType('premium')}
              >
                <h4 style={{ fontSize: '1.1em', fontWeight: '600', marginBottom: '8px' }}>Premium Land</h4>
                <p style={{ margin: '4px 0', color: '#9ca3af' }}>$10.00</p>
                <p style={{ margin: '4px 0', color: '#9ca3af' }}>Full Features</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleNext}
                disabled={(landType === 'free' && !hasEnoughCredits) || !companyInfo.companyName || !companyInfo.website || !companyInfo.logoSvg || !companyInfo.shortDescription}
                style={{
                  ...((landType === 'free' && !hasEnoughCredits) || !companyInfo.companyName || !companyInfo.website || !companyInfo.logoSvg || !companyInfo.shortDescription ? { ...buttonStyle, backgroundColor: '#6b7280', cursor: 'not-allowed' } : primaryButtonStyle)
                }}
              >
                {(landType === 'free' && !hasEnoughCredits) ? 'No Credits Available' : (!companyInfo.companyName || !companyInfo.website || !companyInfo.logoSvg || !companyInfo.shortDescription) ? 'Complete Company Info' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Building Type & Model Selection */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: '1.25em', marginBottom: '20px', textAlign: 'center', color: '#e5e7eb' }}>Building Type & Model Selection</h3>

            {/* Model Selection for Premium Users */}
            {landType === 'premium' && mainBuilding.type && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '18px', marginBottom: '16px', color: '#3b82f6', fontWeight: 'bold' }}>Choose Model Type</h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <div
                    style={{
                      backgroundColor: !customModel.enabled ? '#3b82f6' : '#374151',
                      color: !customModel.enabled ? 'white' : '#d1d5db',
                      cursor: 'pointer',
                      padding: '16px',
                      textAlign: 'center' as const,
                      borderRadius: '8px',
                      border: !customModel.enabled ? '2px solid #60a5fa' : '2px solid transparent',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setCustomModel({ ...customModel, enabled: false })}
                    onMouseOver={(e) => {
                      if (customModel.enabled) {
                        e.currentTarget.style.backgroundColor = '#4b5563';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (customModel.enabled) {
                        e.currentTarget.style.backgroundColor = '#374151';
                      }
                    }}
                  >
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Free Models</div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>Choose from our collection</div>
                  </div>

                  <div
                    style={{
                      backgroundColor: customModel.enabled ? '#3b82f6' : '#374151',
                      color: customModel.enabled ? 'white' : '#d1d5db',
                      cursor: 'pointer',
                      padding: '16px',
                      textAlign: 'center' as const,
                      borderRadius: '8px',
                      border: customModel.enabled ? '2px solid #60a5fa' : '2px solid transparent',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setCustomModel({ ...customModel, enabled: true })}
                    onMouseOver={(e) => {
                      if (!customModel.enabled) {
                        e.currentTarget.style.backgroundColor = '#4b5563';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!customModel.enabled) {
                        e.currentTarget.style.backgroundColor = '#374151';
                      }
                    }}
                  >
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Custom Model</div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>Upload your own 3D model</div>
                  </div>
                </div>

                {/* Custom Model Upload Section */}
                {customModel.enabled && (
                  <div style={{
                    marginTop: '20px',
                    padding: '20px',
                    backgroundColor: '#1f2937',
                    borderRadius: '8px',
                    border: '1px solid #374151'
                  }}>
                    <h5 style={{ fontSize: '16px', marginBottom: '12px', color: '#3b82f6', fontWeight: 'bold' }}>Upload Custom 3D Model</h5>
                    <input
                      type="file"
                      accept=".glb,.gltf,.obj,.fbx"
                      onChange={handleFileUpload}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#374151',
                        border: '1px solid #4b5563',
                        borderRadius: '6px',
                        color: '#d1d5db',
                        fontSize: '14px',
                        marginBottom: '12px'
                      }}
                    />
                    {customModel.file && (
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#065f46',
                        borderRadius: '6px',
                        color: '#d1fae5',
                        fontSize: '14px'
                      }}>
                        <strong>File:</strong> {customModel.file.name}<br />
                        <strong>Size:</strong> {(customModel.file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Model Selection */}
            <div style={{ overflowY: 'auto' }}>
              <BuildingModelSelector
                selectedModel={mainBuilding.modelData?.id || ''}
                onModelSelect={(modelId, modelData) => {
                  setMainBuilding({
                    ...mainBuilding,
                    type: modelData.type === 'model' ? modelData.modelType : modelData.buildingType,
                    modelData: modelData
                  });
                }}
                className="mb-8"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
              <button
                style={secondaryButtonStyle}
                onClick={handlePrevious}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#374151'}
              >
                Previous
              </button>
              <button
                style={{
                  ...primaryButtonStyle,
                  opacity: mainBuilding.type && (landType === 'free' || (landType === 'premium' && (customModel.enabled ? customModel.file : true))) ? 1 : 0.5,
                  cursor: mainBuilding.type && (landType === 'free' || (landType === 'premium' && (customModel.enabled ? customModel.file : true))) ? 'pointer' : 'not-allowed'
                }}
                onClick={handleNext}
                disabled={!mainBuilding.type || (landType === 'premium' && customModel.enabled && !customModel.file)}
                onMouseOver={(e) => {
                  if (mainBuilding.type && (landType === 'free' || (landType === 'premium' && (customModel.enabled ? customModel.file : true)))) {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                  }
                }}
                onMouseOut={(e) => {
                  if (mainBuilding.type && (landType === 'free' || (landType === 'premium' && (customModel.enabled ? customModel.file : true)))) {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                  }
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Address & Location */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: '1.25em', marginBottom: '20px', textAlign: 'center', color: '#e5e7eb' }}>Address & Location</h3>
            
            {/* Address Information */}
            <div style={{
              marginBottom: '32px',
              padding: '20px',
              backgroundColor: '#1f2937',
              borderRadius: '8px',
              border: '1px solid #374151'
            }}>
              <h4 style={{ fontSize: '18px', marginBottom: '16px', color: '#3b82f6', fontWeight: 'bold' }}>Building Address</h4>
              
              {/* Street Address */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Street Address *</label>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  placeholder="123 Main Street"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    color: '#d1d5db',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* City */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>City *</label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  placeholder="New York"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    color: '#d1d5db',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* State and ZIP */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>State *</label>
                  <input
                    type="text"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    placeholder="NY"
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      color: '#d1d5db',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>ZIP Code *</label>
                  <input
                    type="text"
                    value={address.zipCode}
                    onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                    placeholder="10001"
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      color: '#d1d5db',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Country */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Country *</label>
                <input
                  type="text"
                  value={address.country}
                  onChange={(e) => setAddress({ ...address, country: e.target.value })}
                  placeholder="United States"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    color: '#d1d5db',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
              <button
                style={secondaryButtonStyle}
                onClick={handlePrevious}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#374151'}
              >
                Previous
              </button>
              <button
                style={{
                  ...primaryButtonStyle,
                  opacity: address.street && address.city && address.state && address.zipCode && address.country ? 1 : 0.5,
                  cursor: address.street && address.city && address.state && address.zipCode && address.country ? 'pointer' : 'not-allowed'
                }}
                onClick={handleNext}
                disabled={!address.street || !address.city || !address.state || !address.zipCode || !address.country}
                onMouseOver={(e) => {
                  if (address.street && address.city && address.state && address.zipCode && address.country) {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                  }
                }}
                onMouseOut={(e) => {
                  if (address.street && address.city && address.state && address.zipCode && address.country) {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                  }
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Mailbox Configuration */}
        {step === 4 && (
          <div>
            <h3 style={{ fontSize: '1.25em', marginBottom: '20px', textAlign: 'center', color: '#e5e7eb' }}>Mailbox Configuration</h3>
            
            {/* Enable Mailbox */}
            <div style={{
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#1f2937',
              borderRadius: '8px',
              border: '1px solid #374151'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  id="enableMailbox"
                  checked={mailbox.enabled}
                  onChange={(e) => setMailbox({ ...mailbox, enabled: e.target.checked })}
                  style={{ marginRight: '12px', width: '18px', height: '18px' }}
                />
                <label htmlFor="enableMailbox" style={{ color: '#d1d5db', fontWeight: '500', fontSize: '16px' }}>
                  Enable Mailbox (+$5.00/month)
                </label>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                Allow visitors to send messages directly to your plot
              </p>
            </div>

            {/* Mailbox Configuration */}
            {mailbox.enabled && (
              <div style={{
                marginBottom: '24px',
                padding: '20px',
                backgroundColor: '#1f2937',
                borderRadius: '8px',
                border: '1px solid #374151'
              }}>
                <h4 style={{ fontSize: '18px', marginBottom: '16px', color: '#3b82f6', fontWeight: 'bold' }}>Mailbox Settings</h4>
                
                {/* Mailbox Address */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Mailbox Address</label>
                  <input
                    type="text"
                    value={mailbox.address}
                    onChange={(e) => setMailbox({ ...mailbox, address: e.target.value })}
                    placeholder="your-company@metrospace.com"
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      color: '#d1d5db',
                      fontSize: '14px'
                    }}
                  />
                  <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>
                    This will be your public contact address
                  </p>
                </div>

                {/* Mailbox Type */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Mailbox Type</label>
                  <select
                    value={mailbox.type}
                    onChange={(e) => setMailbox({ ...mailbox, type: e.target.value as 'basic' | 'business' | 'enterprise' })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      color: '#d1d5db',
                      fontSize: '14px'
                    }}
                  >
                    <option value="basic">Basic (100 messages/month)</option>
                    <option value="business">Business (500 messages/month) +$10</option>
                    <option value="enterprise">Enterprise (Unlimited) +$25</option>
                  </select>
                </div>

                {/* Auto-responder */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      type="checkbox"
                      id="enableAutoResponder"
                      checked={mailbox.autoResponder}
                      onChange={(e) => setMailbox({ ...mailbox, autoResponder: e.target.checked })}
                      style={{ marginRight: '12px', width: '18px', height: '18px' }}
                    />
                    <label htmlFor="enableAutoResponder" style={{ color: '#d1d5db', fontWeight: '500' }}>
                      Enable Auto-responder
                    </label>
                  </div>
                  {mailbox.autoResponder && (
                    <textarea
                      value={mailbox.customGreeting}
                      onChange={(e) => setMailbox({ ...mailbox, customGreeting: e.target.value })}
                      placeholder="Thank you for your message. We'll get back to you soon!"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#374151',
                        border: '1px solid #4b5563',
                        borderRadius: '6px',
                        color: '#d1d5db',
                        fontSize: '14px',
                        resize: 'vertical' as const
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
              <button
                style={secondaryButtonStyle}
                onClick={handlePrevious}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#374151'}
              >
                Previous
              </button>
              <button
                style={primaryButtonStyle}
                onClick={handleNext}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Advertising Configuration */}
        {step === 5 && (
          <div>
            <h3 style={{ fontSize: '1.25em', marginBottom: '20px', textAlign: 'center', color: '#e5e7eb' }}>Advertising Configuration</h3>
            
            {/* Company Details */}
            <div style={{
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#1f2937',
              borderRadius: '8px',
              border: '1px solid #374151'
            }}>
              <h4 style={{ fontSize: '18px', marginBottom: '16px', color: '#3b82f6', fontWeight: 'bold' }}>Company Details</h4>
              
              {/* Company Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Company Description</label>
                <textarea
                  value={advertising.description}
                  onChange={(e) => setAdvertising({ ...advertising, description: e.target.value })}
                  placeholder="Describe your company and what you do..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    color: '#d1d5db',
                    fontSize: '14px',
                    resize: 'vertical' as const
                  }}
                />
              </div>

              {/* Contact Information */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Contact Email</label>
                  <input
                    type="email"
                    value={advertising.contact.email}
                    onChange={(e) => setAdvertising({ ...advertising, contact: { ...advertising.contact, email: e.target.value } })}
                    placeholder="contact@company.com"
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      color: '#d1d5db',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Phone Number</label>
                  <input
                    type="tel"
                    value={advertising.contact.phone}
                    onChange={(e) => setAdvertising({ ...advertising, contact: { ...advertising.contact, phone: e.target.value } })}
                    placeholder="+1 (555) 123-4567"
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      color: '#d1d5db',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Industry */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Industry</label>
                <select
                  value={advertising.industry}
                  onChange={(e) => setAdvertising({ ...advertising, industry: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    color: '#d1d5db',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Industry</option>
                  <option value="technology">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="retail">Retail</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="consulting">Consulting</option>
                  <option value="real-estate">Real Estate</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Services */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Services/Products</label>
                <textarea
                  value={advertising.services.join(', ')}
                  onChange={(e) => setAdvertising({ ...advertising, services: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                  placeholder="Web Development, Mobile Apps, Consulting (comma-separated)"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    color: '#d1d5db',
                    fontSize: '14px',
                    resize: 'vertical' as const
                  }}
                />
              </div>
            </div>

            {/* Social Media */}
            <div style={{
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#1f2937',
              borderRadius: '8px',
              border: '1px solid #374151'
            }}>
              <h4 style={{ fontSize: '18px', marginBottom: '16px', color: '#3b82f6', fontWeight: 'bold' }}>Social Media (Optional)</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>LinkedIn</label>
                  <input
                    type="url"
                    value={advertising.socialMedia.linkedin}
                    onChange={(e) => setAdvertising({ ...advertising, socialMedia: { ...advertising.socialMedia, linkedin: e.target.value } })}
                    placeholder="https://linkedin.com/company/yourcompany"
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      color: '#d1d5db',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Twitter</label>
                  <input
                    type="url"
                    value={advertising.socialMedia.twitter}
                    onChange={(e) => setAdvertising({ ...advertising, socialMedia: { ...advertising.socialMedia, twitter: e.target.value } })}
                    placeholder="https://twitter.com/yourcompany"
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      color: '#d1d5db',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div style={{
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#1f2937',
              borderRadius: '8px',
              border: '1px solid #374151'
            }}>
              <h4 style={{ fontSize: '18px', marginBottom: '16px', color: '#3b82f6', fontWeight: 'bold' }}>Business Hours (Optional)</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Weekdays</label>
                  <input
                    type="text"
                    value={advertising.businessHours.weekdays}
                    onChange={(e) => setAdvertising({ ...advertising, businessHours: { ...advertising.businessHours, weekdays: e.target.value } })}
                    placeholder="9:00 AM - 5:00 PM"
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      color: '#d1d5db',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Weekends</label>
                  <input
                    type="text"
                    value={advertising.businessHours.weekends}
                    onChange={(e) => setAdvertising({ ...advertising, businessHours: { ...advertising.businessHours, weekends: e.target.value } })}
                    placeholder="10:00 AM - 2:00 PM or Closed"
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      color: '#d1d5db',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
              <button
                style={secondaryButtonStyle}
                onClick={handlePrevious}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#374151'}
              >
                Previous
              </button>
              <button
                style={primaryButtonStyle}
                onClick={handleNext}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 6: AI Features Configuration */}
        {step === 6 && (
          <div>
            <h3 style={{ fontSize: '1.25em', marginBottom: '20px', textAlign: 'center', color: '#e5e7eb' }}>AI Features Configuration</h3>
            
            {/* AI Chatbot */}
            <div style={{
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#1f2937',
              borderRadius: '8px',
              border: '1px solid #374151'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  id="enableChatbot"
                  checked={aiFeatures.chatbot}
                  onChange={(e) => setAiFeatures({ ...aiFeatures, chatbot: e.target.checked })}
                  style={{ marginRight: '12px', width: '18px', height: '18px' }}
                />
                <label htmlFor="enableChatbot" style={{ color: '#d1d5db', fontWeight: '500', fontSize: '16px' }}>
                  Enable AI Chatbot (+$15.00/month)
                </label>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                Provide instant responses to visitor inquiries using AI
              </p>
            </div>

            {/* AI Auto-responder */}
            <div style={{
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#1f2937',
              borderRadius: '8px',
              border: '1px solid #374151'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  id="enableAIAutoResponder"
                  checked={aiFeatures.autoResponder}
                  onChange={(e) => setAiFeatures({ ...aiFeatures, autoResponder: e.target.checked })}
                  style={{ marginRight: '12px', width: '18px', height: '18px' }}
                />
                <label htmlFor="enableAIAutoResponder" style={{ color: '#d1d5db', fontWeight: '500', fontSize: '16px' }}>
                  Enable AI Auto-responder (+$10.00/month)
                </label>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                Automatically respond to messages with intelligent, context-aware replies
              </p>
            </div>

            {/* Lead Capture */}
            <div style={{
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#1f2937',
              borderRadius: '8px',
              border: '1px solid #374151'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  id="enableLeadCapture"
                  checked={aiFeatures.leadCapture}
                  onChange={(e) => setAiFeatures({ ...aiFeatures, leadCapture: e.target.checked })}
                  style={{ marginRight: '12px', width: '18px', height: '18px' }}
                />
                <label htmlFor="enableLeadCapture" style={{ color: '#d1d5db', fontWeight: '500', fontSize: '16px' }}>
                  Enable Lead Capture (+$20.00/month)
                </label>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                Automatically identify and capture potential business leads from conversations
              </p>
            </div>

            {/* Business Intelligence */}
            <div style={{
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#1f2937',
              borderRadius: '8px',
              border: '1px solid #374151'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  id="enableBusinessIntelligence"
                  checked={aiFeatures.businessIntelligence}
                  onChange={(e) => setAiFeatures({ ...aiFeatures, businessIntelligence: e.target.checked })}
                  style={{ marginRight: '12px', width: '18px', height: '18px' }}
                />
                <label htmlFor="enableBusinessIntelligence" style={{ color: '#d1d5db', fontWeight: '500', fontSize: '16px' }}>
                  Enable Business Intelligence (+$30.00/month)
                </label>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                Get insights and analytics about visitor behavior and business opportunities
              </p>
            </div>

            {/* AI Personality */}
            {(aiFeatures.chatbot || aiFeatures.autoResponder) && (
              <div style={{
                marginBottom: '24px',
                padding: '20px',
                backgroundColor: '#1f2937',
                borderRadius: '8px',
                border: '1px solid #374151'
              }}>
                <h4 style={{ fontSize: '18px', marginBottom: '16px', color: '#3b82f6', fontWeight: 'bold' }}>AI Personality</h4>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>AI Personality Type</label>
                  <select
                    value={aiFeatures.personality}
                    onChange={(e) => setAiFeatures({ ...aiFeatures, personality: e.target.value as 'professional' | 'friendly' | 'casual' | 'technical' })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      color: '#d1d5db',
                      fontSize: '14px'
                    }}
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="casual">Casual</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Custom Prompts (Optional)</label>
                  <textarea
                    value={aiFeatures.customPrompts}
                    onChange={(e) => setAiFeatures({ ...aiFeatures, customPrompts: e.target.value })}
                    placeholder="Add specific instructions for how the AI should behave or respond..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      color: '#d1d5db',
                      fontSize: '14px',
                      resize: 'vertical' as const
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
              <button
                style={secondaryButtonStyle}
                onClick={handlePrevious}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#374151'}
              >
                Previous
              </button>
              <button
                style={primaryButtonStyle}
                onClick={handleNext}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Building Customization & Review */}
        {step === 7 && (
          <div>
            <h3 style={{ fontSize: '1.25em', marginBottom: '20px', textAlign: 'center', color: '#e5e7eb' }}>Building Customization & Review</h3>

            {/* Building Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Building Name</label>
              <input
                type="text"
                value={customModel.name}
                onChange={(e) => setCustomModel({ ...customModel, name: e.target.value })}
                placeholder="Enter building name"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '6px',
                  color: '#d1d5db',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Building Description */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Description</label>
              <textarea
                value={customModel.description}
                onChange={(e) => setCustomModel({ ...customModel, description: e.target.value })}
                placeholder="Describe your building"
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '6px',
                  color: '#d1d5db',
                  fontSize: '14px',
                  resize: 'vertical' as const
                }}
              />
            </div>

            {/* Building Color */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>Building Color</label>
              <input
                type="color"
                value={mainBuilding.color}
                onChange={(e) => setMainBuilding({ ...mainBuilding, color: e.target.value })}
                style={{
                  width: '60px',
                  height: '40px',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              />
            </div>



            {/* Plot Summary */}
            <div style={{
              marginTop: '24px',
              padding: '20px',
              backgroundColor: '#1f2937',
              borderRadius: '8px',
              border: '1px solid #374151'
            }}>
              <h4 style={{ fontSize: '18px', marginBottom: '16px', color: '#3b82f6', fontWeight: 'bold' }}>Plot Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                <div style={{ color: '#9ca3af' }}>Land Type:</div>
                <div style={{ color: '#d1d5db', fontWeight: '500' }}>{landType === 'free' ? 'Free Land' : 'Premium Land'}</div>

                <div style={{ color: '#9ca3af' }}>Building Type:</div>
                <div style={{ color: '#d1d5db', fontWeight: '500' }}>{mainBuilding.type.charAt(0).toUpperCase() + mainBuilding.type.slice(1)}</div>

                <div style={{ color: '#9ca3af' }}>Model Type:</div>
                <div style={{ color: '#d1d5db', fontWeight: '500' }}>{customModel.enabled ? 'Custom Model' : 'Free Model'}</div>

                <div style={{ color: '#9ca3af' }}>Position:</div>
                <div style={{ color: '#d1d5db', fontWeight: '500' }}>({position.x.toFixed(1)}, {position.z.toFixed(1)})</div>
              </div>

              {/* Cost Breakdown */}
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #374151' }}>
                <h5 style={{ fontSize: '16px', marginBottom: '12px', color: '#3b82f6', fontWeight: 'bold' }}>Cost Breakdown</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', fontSize: '14px' }}>
                  <div style={{ color: '#9ca3af' }}>Land Cost:</div>
                  <div style={{ color: '#d1d5db' }}>{landType === 'free' ? 'Free' : '$10.00'}</div>

                  {customModel.enabled && (
                    <>
                      <div style={{ color: '#9ca3af' }}>Custom Model:</div>
                      <div style={{ color: '#d1d5db' }}>$20.00</div>
                    </>
                  )}

                  {mailbox.enabled && (
                    <>
                      <div style={{ color: '#9ca3af' }}>Mailbox ({mailbox.type}):</div>
                      <div style={{ color: '#d1d5db' }}>
                        ${mailbox.type === 'basic' ? '5.00' : mailbox.type === 'business' ? '15.00' : '30.00'}/month
                      </div>
                    </>
                  )}

                  {(aiFeatures.chatbot || aiFeatures.autoResponder || aiFeatures.leadCapture || aiFeatures.businessIntelligence) && (
                    <>
                      <div style={{ color: '#9ca3af' }}>AI Features:</div>
                      <div style={{ color: '#d1d5db' }}>
                        ${(
                          (aiFeatures.chatbot ? 15 : 0) +
                          (aiFeatures.autoResponder ? 10 : 0) +
                          (aiFeatures.leadCapture ? 20 : 0) +
                          (aiFeatures.businessIntelligence ? 30 : 0)
                        ).toFixed(2)}/month
                      </div>
                    </>
                  )}

                  <div style={{ color: '#3b82f6', fontWeight: 'bold', borderTop: '1px solid #374151', paddingTop: '8px' }}>One-time Cost:</div>
                  <div style={{ color: '#3b82f6', fontWeight: 'bold', borderTop: '1px solid #374151', paddingTop: '8px' }}>
                    ${(totalPrice / 100).toFixed(2)}
                  </div>

                  <div style={{ color: '#10b981', fontWeight: 'bold' }}>Monthly Cost:</div>
                  <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                    ${(
                      (mailbox.enabled ? (mailbox.type === 'basic' ? 5 : mailbox.type === 'business' ? 15 : 30) : 0) +
                      (aiFeatures.chatbot ? 15 : 0) +
                      (aiFeatures.autoResponder ? 10 : 0) +
                      (aiFeatures.leadCapture ? 20 : 0) +
                      (aiFeatures.businessIntelligence ? 30 : 0)
                    ).toFixed(2)}/month
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Error */}
            {paymentError && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#7f1d1d',
                borderRadius: '6px',
                color: '#fecaca',
                fontSize: '14px',
                textAlign: 'center' as const
              }}>
                {paymentError}
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
              <button
                style={secondaryButtonStyle}
                onClick={handlePrevious}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#374151'}
              >
                Previous
              </button>
              <button
                style={{
                  ...successButtonStyle,
                  opacity: isSubmitting || isProcessingPayment ? 0.5 : 1,
                  cursor: isSubmitting || isProcessingPayment ? 'not-allowed' : 'pointer'
                }}
                onClick={handleSubmit}
                disabled={isSubmitting || isProcessingPayment}
                onMouseOver={(e) => {
                  if (!isSubmitting && !isProcessingPayment) {
                    e.currentTarget.style.backgroundColor = '#047857';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSubmitting && !isProcessingPayment) {
                    e.currentTarget.style.backgroundColor = '#059669';
                  }
                }}
              >
                {isProcessingPayment ? 'Processing...' : (totalPrice > 0 ? 'Proceed to Payment' : 'Create Plot')}
              </button>
            </div>
          </div>
        )}
      </div>
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          amount={userInfo ? (() => {
            const currentUser = userInfo;
            const plotSize = { width: 10, depth: 10 };
            const totalSquares = plotSize.width * plotSize.depth;
            const userFreeSquaresUsed = currentUser.freeSquaresUsed || 0;
            const baseFreeSquaresLimit = currentUser.freeSquaresLimit || 25;

            let subscriptionBonusSquares = 0;
            if (currentUser.subscriptionTier === "basic") {
              subscriptionBonusSquares = 50;
            } else if (currentUser.subscriptionTier === "premium") {
              subscriptionBonusSquares = 100;
            }
            const totalFreeSquaresAvailable = baseFreeSquaresLimit + subscriptionBonusSquares;

            const remainingFreeSquares = Math.max(0, totalFreeSquaresAvailable - userFreeSquaresUsed);
            const freeSquaresToUse = Math.min(totalSquares, remainingFreeSquares);
            const paidSquares = totalSquares - freeSquaresToUse;

            const calculatedPlotCost = paidSquares * 100;

            let calculatedCustomModelFee = 0;
            if (customModel.enabled) {
              if (currentUser.subscriptionTier === "premium") {
                calculatedCustomModelFee = 0;
              } else if (currentUser.subscriptionTier === "basic") {
                calculatedCustomModelFee = 1000;
              } else {
                calculatedCustomModelFee = 2000;
              }
            }

            return calculatedPlotCost + calculatedCustomModelFee;
          })() : totalPrice}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
          description='Plot Purchase'
          type={customModel.enabled ? 'custom_model' : 'land'}
          userId={user?.id}
        />
      )}
      {showModelUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
            <h3 className="text-xl mb-4">Upload Custom Model</h3>
            <ModelUploader
              onUploadComplete={handleModelUpload}
              onUploadError={(error) => setPaymentError(error)}
            />
            <button
              onClick={() => setShowModelUploader(false)}
              className="mt-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}