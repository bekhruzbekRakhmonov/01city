'use client';

import React, { useState } from 'react';

interface GovernmentHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChoosePlot?: () => void;
}

export function GovernmentHelpModal({ isOpen, onClose, onChoosePlot }: GovernmentHelpModalProps) {
  const [selectedService, setSelectedService] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const services = [
    'Building Permits',
    'Tax Information',
    'Public Services',
    'City Planning',
    'Business Licenses',
    'Community Events',
    'Public Safety',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    alert(`Thank you for contacting us about ${selectedService}. We will get back to you soon!`);
    setIsSubmitting(false);
    setSelectedService('');
    setMessage('');
    onClose();
  };

  const handleChoosePlot = () => {
    if (onChoosePlot) {
      onChoosePlot();
    }
    onClose();
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
    width: '500px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.8em',
    marginBottom: '10px',
    textAlign: 'center',
    color: '#3b82f6',
    fontWeight: 'bold',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '1.1em',
    color: '#9ca3af',
    marginBottom: '25px',
    textAlign: 'center',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '1em',
    color: '#e5e7eb',
    marginBottom: '8px',
    fontWeight: '500',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    marginBottom: '20px',
    borderRadius: '6px',
    border: '1px solid #374151',
    backgroundColor: '#374151',
    color: 'white',
    fontSize: '1em',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    marginBottom: '25px',
    borderRadius: '6px',
    border: '1px solid #374151',
    backgroundColor: '#374151',
    color: 'white',
    fontSize: '1em',
    minHeight: '120px',
    resize: 'vertical',
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
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

  const submitButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#3b82f6',
    color: 'white',
  };

  const cancelButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#6b7280',
    color: 'white',
  };

  const landPurchaseButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '15px',
    marginBottom: '25px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#10b981',
    color: 'white',
    fontSize: '1.1em',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const separatorStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
    color: '#6b7280',
  };

  const separatorLineStyle: React.CSSProperties = {
    flex: 1,
    height: '1px',
    backgroundColor: '#374151',
  };

  const separatorTextStyle: React.CSSProperties = {
    padding: '0 15px',
    fontSize: '0.9em',
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>Government Services</h2>
        <p style={subtitleStyle}>How can I help you today?</p>
        
        <button 
          style={landPurchaseButtonStyle}
          onClick={handleChoosePlot}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
        >
          🏞️ Choose Plot
        </button>
        
        <div style={separatorStyle}>
          <div style={separatorLineStyle}></div>
          <span style={separatorTextStyle}>OR</span>
          <div style={separatorLineStyle}></div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Select a Service:</label>
          <select 
            style={selectStyle}
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            required
          >
            <option value="">Please select a service...</option>
            {services.map((service) => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>

          <label style={labelStyle}>Message (Optional):</label>
          <textarea 
            style={textareaStyle}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please describe how we can assist you..."
          />

          <div style={buttonContainerStyle}>
            <button 
              type="button" 
              style={cancelButtonStyle}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={submitButtonStyle}
              disabled={isSubmitting || !selectedService}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GovernmentHelpModal;