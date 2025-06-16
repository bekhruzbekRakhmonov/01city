import React from 'react';

interface AdvertisingDisplayProps {
  advertising: {
    enabled: boolean;
    companyName: string;
    website?: string;
    logoUrl?: string;
    description?: string;
    contactEmail?: string;
  };
  onClose?: () => void;
}

export function AdvertisingDisplay({ advertising, onClose }: AdvertisingDisplayProps) {
  if (!advertising.enabled) {
    return null;
  }

  const handleWebsiteClick = () => {
    if (advertising.website) {
      window.open(advertising.website, '_blank', 'noopener,noreferrer');
    }
  };

  const handleEmailClick = () => {
    if (advertising.contactEmail) {
      window.open(`mailto:${advertising.contactEmail}`, '_blank');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#1f2937',
      padding: '24px',
      borderRadius: '12px',
      color: 'white',
      width: '400px',
      maxWidth: '90vw',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      zIndex: 1000,
      border: '1px solid #374151'
    }}>
      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
          onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
        >
          ×
        </button>
      )}

      {/* Company Logo */}
      {advertising.logoUrl && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              backgroundImage: `url(${advertising.logoUrl})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }}
          />
        </div>
      )}

      {/* Company Name */}
      <h3 style={{
        fontSize: '1.5em',
        marginBottom: '12px',
        textAlign: 'center',
        color: '#3b82f6',
        fontWeight: 'bold'
      }}>
        {advertising.companyName}
      </h3>

      {/* Description */}
      {advertising.description && (
        <p style={{
          marginBottom: '16px',
          color: '#d1d5db',
          lineHeight: '1.5',
          textAlign: 'center'
        }}>
          {advertising.description}
        </p>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {advertising.website && (
          <button
            onClick={handleWebsiteClick}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            Visit Website
          </button>
        )}

        {advertising.contactEmail && (
          <button
            onClick={handleEmailClick}
            style={{
              padding: '10px 20px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          >
            Contact Us
          </button>
        )}
      </div>
    </div>
  );
}

export default AdvertisingDisplay;