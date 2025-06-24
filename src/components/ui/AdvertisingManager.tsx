import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { Id } from '../../../convex/_generated/dataModel';
import LogoPlayground from './LogoPlayground';

interface AdvertisingManagerProps {
  plotId: Id<'plots'>;
  onClose: () => void;
}

export function AdvertisingManager({ plotId, onClose }: AdvertisingManagerProps) {
  const { user } = useUser();
  const updateAdvertising = useMutation(api.advertising.updateAdvertising);
  const removeAdvertising = useMutation(api.advertising.removeAdvertising);
  const plotAdvertising = useQuery(api.advertising.getPlotAdvertising, { plotId });
  
  const [advertising, setAdvertising] = useState({
    enabled: false,
    companyName: '',
    website: '',
    description: '',
    contactEmail: '',
    logoSvg: '',
    logoPosition: {
      x: 0,
      y: 1,
      z: 1.1,
      scale: 1,
      rotation: 0,
      face: 'front' as 'front' | 'back' | 'left' | 'right' | 'top'
    },
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Load existing advertising data
  useEffect(() => {
    if (plotAdvertising?.advertising) {
      setAdvertising({
        enabled: plotAdvertising.advertising.enabled || false,
        companyName: plotAdvertising.advertising.companyName || '',
        website: plotAdvertising.advertising.website || '',
        description: plotAdvertising.advertising.description || '',
        contactEmail: plotAdvertising.advertising.contactEmail || '',
        logoSvg: plotAdvertising.advertising.logoSvg || '',
        logoPosition: plotAdvertising.advertising.logoPosition || {
          x: 0,
          y: 1,
          z: 1.1,
          scale: 1,
          rotation: 0,
          face: 'front' as 'front' | 'back' | 'left' | 'right' | 'top'
        },
      });
    }
  }, [plotAdvertising]);

  const handleSave = async () => {
    if (!user) return;
    
    if (advertising.enabled && !advertising.companyName.trim()) {
      setMessage('Company name is required when advertising is enabled.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      await updateAdvertising({
        userId: user.id,
        plotId,
        advertising: {
          enabled: advertising.enabled,
          companyName: advertising.companyName.trim(),
          website: advertising.website.trim() || undefined,
          description: advertising.description.trim() || undefined,
          contactEmail: advertising.contactEmail.trim() || undefined,
          logoSvg: advertising.logoSvg || undefined,
          logoPosition: advertising.logoPosition,
        },
      });
      
      setMessage('Advertising settings updated successfully!');
      setMessageType('success');
      
      // Close after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      setMessage(error.message || 'Failed to update advertising settings.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to remove all advertising from this plot?')) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      await removeAdvertising({
        userId: user.id,
        plotId,
      });
      
      setMessage('Advertising removed successfully!');
      setMessageType('success');
      
      // Reset form
      setAdvertising({
        enabled: false,
        companyName: '',
        website: '',
        description: '',
        contactEmail: '',
        logoSvg: '',
        logoPosition: {
          x: 0,
          y: 1,
          z: 1.1,
          scale: 1,
          rotation: 0,
          face: 'front' as 'front' | 'back' | 'left' | 'right' | 'top'
        },
      });
      
      // Close after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      setMessage(error.message || 'Failed to remove advertising.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
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
    }}>
      <div style={{
        backgroundColor: '#1f2937',
        padding: '30px',
        borderRadius: '12px',
        color: 'white',
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
          onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
        >
          ×
        </button>

        <h2 style={{
          fontSize: '1.8em',
          marginBottom: '20px',
          textAlign: 'center',
          color: '#3b82f6',
          fontWeight: 'bold',
        }}>
          Manage Advertising
        </h2>

        {/* Enable Advertising Toggle */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={advertising.enabled}
              onChange={(e) => setAdvertising({ ...advertising, enabled: e.target.checked })}
              style={{ marginRight: '12px', transform: 'scale(1.2)' }}
            />
            <span style={{ color: '#d1d5db', fontWeight: '500', fontSize: '16px' }}>
              Enable company advertising on this building
            </span>
          </label>
        </div>

        {advertising.enabled && (
          <>
            {/* Company Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>
                Company Name *
              </label>
              <input
                type="text"
                value={advertising.companyName}
                onChange={(e) => setAdvertising({ ...advertising, companyName: e.target.value })}
                placeholder="Enter your company name"
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
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>
                Website
              </label>
              <input
                type="url"
                value={advertising.website}
                onChange={(e) => setAdvertising({ ...advertising, website: e.target.value })}
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

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>
                Company Description
              </label>
              <textarea
                value={advertising.description}
                onChange={(e) => setAdvertising({ ...advertising, description: e.target.value })}
                placeholder="Describe your company or products"
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

            {/* Contact Email */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db', fontWeight: '500' }}>
                Contact Email
              </label>
              <input
                type="email"
                value={advertising.contactEmail}
                onChange={(e) => setAdvertising({ ...advertising, contactEmail: e.target.value })}
                placeholder="contact@yourcompany.com"
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

            {/* Logo Playground */}
            <div style={{ marginBottom: '20px', borderTop: '1px solid #4b5563', paddingTop: '20px' }}>
              <LogoPlayground
                logoSvg={advertising.logoSvg}
                logoPosition={advertising.logoPosition}
                onLogoUpload={(svgContent) => {
                  setAdvertising({ ...advertising, logoSvg: svgContent });
                }}
                onPositionChange={(position) => {
                  setAdvertising({ ...advertising, logoPosition: position });
                }}
                companyName={advertising.companyName}
              />
            </div>
          </>
        )}

        {/* Message */}
        {message && (
          <div style={{
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: messageType === 'success' ? '#065f46' : '#7f1d1d',
            borderRadius: '6px',
            color: messageType === 'success' ? '#d1fae5' : '#fecaca',
            fontSize: '14px',
            textAlign: 'center' as const
          }}>
            {message}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
          {plotAdvertising?.advertising?.enabled && (
            <button
              onClick={handleRemove}
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: isLoading ? 0.5 : 1,
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {
                if (!isLoading) e.currentTarget.style.backgroundColor = '#b91c1c';
              }}
              onMouseOut={(e) => {
                if (!isLoading) e.currentTarget.style.backgroundColor = '#dc2626';
              }}
            >
              Remove Advertising
            </button>
          )}
          
          <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: '#374151',
                color: '#d1d5db',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#374151'}
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: isLoading ? 0.5 : 1,
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {
                if (!isLoading) e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseOut={(e) => {
                if (!isLoading) e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdvertisingManager;